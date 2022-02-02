const express = require('express')
const router = express.Router()
const Order = require('../models/order')
const CreditCard = require('../models/credit_card')
const DVD = require('../models/dvd')


router.get('/customer_orders', async (req, res) => {
    try {
        if(req.session.role!="Admin"){
            res.redirect('/');
            return;
        }
        const orders = await Order.find({ state: { $in: [0,1,3] } }).populate('dvd').sort('-createdAt')
        res.render('./admin/customer_orders', {
            orders: orders,
            role: req.session.role
        })
    } catch (err) {
        console.log(error);
        res.redirect('/');
    }
})

router.get('/customer_orders/view/:id', async (req, res) => {
    try {
        if(req.session.role!="Admin"){
            res.redirect('/');
            return;
        }
        const order = await Order.findById(req.params.id).populate('dvd').populate('pelatis').populate('credit_card')
        res.render('./admin/view_order', {
            order: order,
            role: req.session.role
        })
    } catch (err) {
        console.log(err);
        res.redirect('/');
    }
})

router.delete('/customer_orders/:id', async (req, res) => {
    let order
    try {
        if(req.session.role!="Admin"){
            res.redirect('/');
            return;
        }
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
        order.description = "Order not accepted";
        order.state=6;
        await order.save();
        res.redirect('/admin/customer_orders');
    } catch {
        res.redirect('/admin/customer_orders');
    }
})

router.put('/customer_orders/charge/:id', async (req, res) => {
    let order
    try {
        if(req.session.role!="Admin"){
            res.redirect('/');
            return;
        }
        order = await Order.findById(req.params.id).populate('pelatis').populate('dvd')
        const order_amount = order.amount * order.dvd.price;
        const check_credit_card_amount = await CreditCard.findOne({
            pelatis: order.pelatis.id,
            activated: true
        }).populate('pelatis')

        if (check_credit_card_amount == null || check_credit_card_amount.lenght == 0) {
            console.log("No Activated Card");
            order.state = 2;
            order.description = "No Activated Credit Card";
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
        } else if (check_credit_card_amount.amount < order_amount) {
            console.log("Not enough money in Card");
            order.state = 2;
            order.description = "Not Enough Money In The Card!!";
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
        } else if (order.dvd.inStock < order.amount) {
            console.log("Not Enough DVDs In Stock");
            order.state = 2;
            order.description = "Not Enough DVDs In Stock!!";
        } else {
            console.log("Order Final");

            await CreditCard.updateOne({
                _id: check_credit_card_amount.id
            }, {
                $set: {
                    amount: check_credit_card_amount.amount - order_amount
                },
                $currentDate: {
                    lastModified: true
                }
            });
            order.state = 1;
            order.credit_card = check_credit_card_amount;
            order.description = "Waiting for shiping";
        }
        await order.save();
        res.redirect('/admin/customer_orders');
    } catch (err) {
        console.log(err);
        res.redirect('/admin/customer_orders');
    }
})

router.put('/customer_orders/cancel/:id', async (req, res) => {
    let order
    try {
        if(req.session.role!="Admin"){
            res.redirect('/');
            return;
        }
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
        res.redirect('/admin/customer_orders');
    } catch (err) {
        console.log(err);
        res.redirect('/admin/customer_orders');
    }
})

router.put('/customer_orders/sent/:id', async (req, res) => {
    let order
    try {
        if(req.session.role!="Admin"){
            res.redirect('/');
            return;
        }
        order = await Order.findById(req.params.id)
        order.state = 3
        order.description = "Order Sent!!"
        await order.save()
        res.redirect('/admin/customer_orders');
    } catch {
        res.redirect('/admin/customer_orders');
    }
})

router.put('/customer_orders/done/:id', async (req, res) => {
    let order
    try {
        if(req.session.role!="Admin"){
            res.redirect('/');
            return;
        }
        order = await Order.findById(req.params.id)
        order.state = 4
        order.description = "Order Done!!"
        await order.save()
        res.redirect('/admin/customer_orders');
    } catch {
        res.redirect('/admin/customer_orders');
    }
})

// router.get('/login', async (req, res) => {
//     let books
//     try {
//         books = await Book.find().sort({
//             createdAt: 'desc'
//         }).limit(10).exec()
//     } catch {
//         books = []
//     }
//     console.log(req.session.role);
//     res.render('index', {
//         books: books,
//         role: req.session.role
//     })
// })

// router.post("/login", (req, res) => {
//     try {
//         req.session.role = "Admin"; // this will be based on the login

//         res.redirect("/")

//     } catch (error) {

//     }

// });

module.exports = router