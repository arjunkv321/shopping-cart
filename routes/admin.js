var express = require('express');

var producthelpers = require('../helpers/producthelpers');
var router = express.Router();


/* GET users listing. */
router.get('/', function(req, res, next) {
  producthelpers.getAllProduct().then((product)=>
  {
    res.render('admin/products',{adminlog:true,product});
  })
  
});

router.get('/add-product', function(req, res, next) {

  res.render('admin/add-product',{adminlog:true});
});

router.post('/add-product', function(req, res, next) {
  producthelpers.addproduct(req.body,(result)=>{
    res.redirect('/admin');
    let image=req.files.image
    image.mv('./public/product-image/'+result+'.jpg')
  })
  console.log(req.body)
  console.log(req.files.image)
  
});

router.get('/delete-product/:id', function(req, res, next) {
  id=req.params.id
  producthelpers.getDeleteProduct(id).then(()=>res.redirect('/admin'))
});

router.get('/edit-product/:id', function(req, res, next) {
  id=req.params.id
  producthelpers.getOneproduct(id).then((product)=>{
    console.log(product)
    res.render('admin/edit-product',{adminlog:true,product})
  })
  
});

router.post('/edit-product/:id', function(req, res, next) {
  id=req.params.id
  producthelpers.getEditProduct(id,req.body).then(()=>{
    if (req.files.image){
      let image=req.files.image
    image.mv('./public/product-image/'+id+'.jpg')
    }
    res.redirect('/admin')})
});

module.exports = router;
