import Joi from 'joi';
import { Op } from 'sequelize';
import { sendEmail } from '../../utils/sendEmail'
import models from '../../models';
import { makeSha512, createSaltHashPassword, encrypt, b64Encode, b64Decode } from '../../utils/encryption';


const login_validation = {
  body: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required(),
    password: Joi.string()
      .min(8)
      .max(30)
      .required()
  })
};
const login = async (req, res, next) => {
  const { error, value } = login_validation.body.validate(req.body);
  if (error) {
    return res.send(400, { error });
  }

  const { username, password } = req.body;
  const user = await models.user.findOne({
    where: { [Op.or]: { username: username.trim(), email: username.trim() } }
  });

  if (user) {
    const hash = makeSha512(password, user.password_salt);

    if (hash === user.password_hash) {
      if (user.email_confirmation === false) {
        return res.send(403, { message: 'This account not confirmated' })
      }
      const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const token = await user.createAccessToken(ip_address);
      return res.status(200).send({ token: token.toJSON() });
    }
  }
  res.send(400, { error: 'User not found!' });
};

const register_validation = {
  body: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required(),
    password: Joi.string()
      .min(8)
      .max(30)
      .required(),
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
    name: Joi.string().min(5).max(30).required()
  })
};
const register = async (req, res, next) => {
  const { error, value } = register_validation.body.validate(req.body);
  if (error) {
    return res.send(400, { error });
  }

  const { username, password, email, name } = req.body;
  let user = await models.user.findOne({
    where: { [Op.or]: { username: username.trim(), email: email.trim() } }
  });

  if (user) {
    return res.send(400, { error: 'E-mail address or username is used!' });
  }

  const {
    salt: password_salt,
    hash: password_hash
  } = createSaltHashPassword(password);
  const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  user = await models.user.create({
    username,
    email,
    name,
    password_salt,
    password_hash
  })

  const token = await user.createAccessToken(ip_address);
  res.send(201, { user: user.toJSON(), token: token.toJSON() });

  sendEmail(user);
};
const me = (req, res, next) => {
  res.send(200, req.user);
}

const confirmEmail = async (req, res, next) => {
  const user = await models.user.findOne({
    where: {
      email: b64Decode(req.query.token)
    }
  });
  if (!user) {
    res.send(403, { message: 'Error! Your account has already been confirmed' })
  }
  user.email_confirmation = true;
  await user.save()
  return res.redirect(`${process.env.FRONTEND_PATH}/login`);

}

export default {
  prefix: '/authentications',
  inject: (router) => {
    router.get('/me', me);
    router.post('/register', register);
    router.post('/login', login);
    router.get('/email-confirmation', confirmEmail);
  }
};
