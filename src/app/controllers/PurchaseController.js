const Ad = require('../models/Ad')
const User = require('../models/User')
const Purchase = require('../models/Purchase')
const PurchaseMail = require('../jobs/PurchaseMail')
const Queue = require('../services/Queue')

class PurchaseController {
  async index (req, res) {
    const purchases = await Purchase.paginate(
      {},
      {
        page: req.query.page || 1,
        limit: 20,
        sort: '-createdAt'
      }
    )
    return res.json(purchases)
  }
  async store (req, res) {
    const { ad, content } = req.body

    const purchaseAd = await Ad.findById(ad).populate('author')
    const user = await User.findById(req.userId)

    if (purchaseAd.purchasedBy) {
      return res.status(400).json({ error: 'This ad has been purchase' })
    }

    Queue.create(PurchaseMail.key, {
      ad: purchaseAd,
      user,
      content
    }).save()

    const purchase = await Purchase.create({ ad, content, user })

    purchase.user = purchase.user.id

    return res.json(purchase)
  }

  async accept (req, res) {
    const { purchase } = req.body

    const purchaseAd = await Purchase.findById(purchase).populate([
      'user',
      'ad'
    ])

    if (!purchaseAd) {
      return res.status(400).json({ error: 'This purchase not exists' })
    }

    if (purchaseAd.ad.purchasedBy) {
      return res.status(400).json({ error: 'This ad has been purchase' })
    }

    const user = await User.findById(req.userId)

    if (!purchaseAd.ad.author === user.id) {
      return res
        .status(401)
        .json({ error: 'You are not the author of this ad' })
    }

    const ad = await Ad.findByIdAndUpdate(
      purchaseAd.ad.id,
      {
        purchasedBy: purchaseAd.user.id
      },
      { new: true }
    )

    return res.json(ad)
  }
}

module.exports = new PurchaseController()
