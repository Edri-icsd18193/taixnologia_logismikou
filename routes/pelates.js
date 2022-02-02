const express = require('express')
const router = express.Router()
const MyClient = require('../models/pelatis')
const CreditCard = require('../models/credit_card')
const Order = require('../models/order')
const DVD = require('../models/dvd')
const dvd = require('../models/dvd')

// Show Cards Route
router.get('/my_cards/:id', async (req, res) => {
  try {
    console.log("Test");
    const card = await CreditCard.findById(req.params.id).populate("pelatis")
    if (req.user.id != card.pelatis.id) {
      res.redirect('/');
      return;
    }
    res.render('pelates/update_card', {
      card: card,
      role: req.session.role,
      user: req.user
    })
  } catch {
    res.redirect('/')
  }
})

router.put('/my_cards/:id', async (req, res) => {
  let card;
  let checker = 0
  try {
    card = await CreditCard.findById(req.params.id)
    card.name = req.body.name
    card.amount = req.body.amount
    card.createdAt = new Date(req.body.createdAt)
    card.activated = req.body.activated

    if (card.activated == true) {
      const check_credit_cards = await CreditCard.find({
          pelatis: req.user._id
        })
        .populate('pelatis')

      check_credit_cards.forEach(element => {
        if (element.activated == true) {
          checker = 1
          console.log("Found one");
        }
      });
    }

    if (checker == 0) {
      await card.save()
      res.redirect(`/pelates/my_cards`)
    } else {
      res.redirect(`/`)
    }

  } catch {
    res.redirect('/')
  }
})

router.get('/dashboard', async (req, res) => {
  try {
    console.log(req.user);
  } catch {}
  console.log(req.session.role);
  res.render('./pelates/dashboard', {
    pelatis: req.user,
    role: req.session.role
  })
})

router.get('/my_cards', async (req, res) => {
  try {

    const my_credit_cards = await CreditCard.find({
        pelatis: req.user._id
      })
      .populate('pelatis')

    res.render('./pelates/my_cards', {
      pelatis: req.user,
      role: req.session.role,
      cards: my_credit_cards
    })
  } catch {
    res.redirect('/')
  }

})

router.get('/new_card', async (req, res) => {
  try {
    console.log(req.user);
  } catch {}
  console.log(req.session.role);
  res.render('./pelates/new_card', {
    pelatis: req.user,
    role: req.session.role
  })
})

router.post('/new_card', async (req, res) => {
  const card = new CreditCard({
    name: req.body.name,
    amount: req.body.amount,
    createdAt: new Date(req.body.createdAt),
    pageCount: req.body.pageCount,
    pelatis: req.user._id
  })
  try {
    const newCard = await card.save()
    res.redirect(`my_cards`)
  } catch {
    res.redirect(`pelates`)
  }
})

// Show DVD Route
router.get('/orders', async (req, res) => {
  orderTab([0, 1, 3], res, req, "orders")
})

router.get('/history', async (req, res) => {
  orderTab([2, 4, 6], res, req, "history")
})

async function orderTab(x, res, req, tab) {
  try {
    const orders = await Order.find({
      pelatis: req.user._id,
      state: {
        $in: x
      }
    }).populate('pelatis').populate("dvd").sort('-createdAt')

    res.render('./pelates/orders', {
      orders: orders,
      role: req.session.role,
      user: req.user,
      pelatis: req.user,
      tab: tab
    })
  } catch (err) {
    console.log(err);
    res.redirect('/')
  }
}

router.get('/orders/view/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('dvd').populate('pelatis').populate('credit_card')
    if (req.user.id != order.pelatis.id) {
      res.redirect('/');
      return;
    }
    res.render('./pelates/view_order', {
      order: order,
      role: req.session.role
    })
  } catch (err) {
    console.log(err);
    res.redirect('/');
  }
})

router.put('/orders/cancel/:id', async (req, res) => {
  let order
  try {
    order = await Order.findById(req.params.id).populate('pelatis').populate('dvd').populate('credit_card')
    const order_amount = order.amount * order.dvd.price;
    await DVD.updateOne({
      _id: order.dvd.id
    }, {
      $set: {
        inStock: order.dvd.inStock + order.amount
      },
      $currentDate: {
        lastModified: true
      }
    });
    await CreditCard.updateOne({
      _id: order.credit_card.id
    }, {
      $set: {
        amount: order.credit_card.amount + order_amount
      },
      $currentDate: {
        lastModified: true
      }
    });
    order.state = 2
    order.description = "Order Canceled"
    await order.save()
    res.redirect('/pelates/orders');
  } catch (err) {
    console.log(err);
    res.redirect('/pelates/orders');
  }
})

router.post('/orders/cancel/:id', async (req, res) => {
  let order
  try {
    order = await Order.findById(req.params.id).populate("dvd")
    if (order.state == 0) {
      await DVD.updateOne({
        _id: order.dvd.id
      }, {
        $set: {
          inStock: order.dvd.inStock + order.amount
        },
        $currentDate: {
          lastModified: true
        }
      });
    }
    order.description = "Order Cancel";
    order.state = 2;
    await order.save();
    res.redirect('/pelates/orders');
  } catch {
    res.redirect('/pelates/orders');
  }
})

router.post('/orders/:id', async (req, res) => {
  console.log("Im into the order Pelatis");
  let order;
  try {
    const find_dvd = await DVD.findById(req.params.id)
    const order_amount = req.body.amount * find_dvd.price;

    if (find_dvd.inStock < req.body.amount) {
      console.log("Not Enough DVDs In Stock");
      order = new Order({
        address: req.user.address,
        amount: req.body.amount,
        state: 2,
        description: "Not Enough DVDs In Stock!!",
        pelatis: req.user._id,
        dvd: req.params.id
      })
    } else {
      console.log("Check DVD");
      await DVD.updateOne({
        _id: find_dvd._id
      }, {
        $set: {
          inStock: find_dvd.inStock - req.body.amount
        },
        $currentDate: {
          lastModified: true
        }
      });
      console.log("Check Order");
      order = new Order({
        address: req.user.address,
        amount: req.body.amount,
        state: 0,
        description: "Waiting For Charging",
        pelatis: req.user._id,
        dvd: req.params.id
      })
      console.log("Out Of Order");
    }
    const newOrder = await order.save()
    console.log(newOrder);
    res.redirect(`/dvds/` + req.params.id)
  } catch {
    console.log("Something went wrong");
    res.redirect(`/dvds` + req.params.id)
  }
})

router.delete('/orders/:id', async (req, res) => {
  let order
  try {
    order = await Order.findById(req.params.id).populate("dvd")
    if (order.state == 0) {
      await DVD.updateOne({
        _id: order.dvd.id
      }, {
        $set: {
          inStock: order.dvd.inStock + order.amount
        },
        $currentDate: {
          lastModified: true
        }
      });
    }
    order.state = 5;
    await order.save();
    res.redirect('/pelates/history');
  } catch {
    res.redirect('/pelates/history');
  }
})


// router.post('/orders/:id', async (req, res) => {
//   console.log("Im into the order");
//   let order;
//   try {
//     const find_dvd = await DVD.findById(req.params.id)
//     const order_amount = req.body.amount * find_dvd.price;
//     const check_credit_card_amount = await CreditCard.findOne({
//         pelatis: req.user._id,
//         activated: true
//       })
//       .populate('pelatis')

//     console.log(check_credit_card_amount);
//     if (check_credit_card_amount == null || check_credit_card_amount.lenght == 0) {
//       console.log("No Activated Card");
//       order = new Order({
//         address: req.user.address,
//         amount: req.body.amount,
//         state: 2,
//         description: "No Activated Credit Card",
//         pelatis: req.user._id,
//         dvd: req.params.id
//       })

//     } else if (check_credit_card_amount.amount < order_amount) {
//       console.log("Not enough money in Card");
//       order = new Order({
//         address: req.user.address,
//         amount: req.body.amount,
//         state: 2,
//         description: "Not Enough Money In The Card!!",
//         pelatis: req.user._id,
//         dvd: req.params.id
//       })

//     } else if (find_dvd.inStock < req.body.amount) {
//       console.log("Not Enough DVDs In Stock");
//       order = new Order({
//         address: req.user.address,
//         amount: req.body.amount,
//         state: 2,
//         description: "Not Enough DVDs In Stock!!",
//         pelatis: req.user._id,
//         dvd: req.params.id
//       })

//     } else {
//       console.log("Order Final");
//       await DVD.updateOne({
//         _id: find_dvd._id
//       }, {
//         $set: {
//           inStock: find_dvd.inStock - req.body.amount
//         },
//         $currentDate: {
//           lastModified: true
//         }
//       });

//       await CreditCard.updateOne({
//         _id: check_credit_card_amount._id
//       }, {
//         $set: {
//           amount: check_credit_card_amount.amount - order_amount
//         },
//         $currentDate: {
//           lastModified: true
//         }
//       });
//       order = new Order({
//         address: req.user.address,
//         amount: req.body.amount,
//         state: 1,
//         description: "",
//         pelatis: req.user._id,
//         dvd: req.params.id,
//         credit_card: check_credit_card_amount
//       })
//       // const newOrder = await order.save()
//     }
//     console.log(check_credit_card_amount);
//     res.redirect(`/dvds`)
//   } catch {
//     console.log("Something went wrong");
//     res.redirect(`/dvds`)
//   }
// })







module.exports = router