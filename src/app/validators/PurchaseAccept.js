const Joi = require('joi')

module.exports = {
  body: {
    purchase: Joi.string().required()
  }
}
