var db=require('../config/connection')
var collection=require('../config/collection')
var objectid=require('mongodb').ObjectID

module.exports={
    addproduct: function(product,callback){
        product.price=parseInt(product.price)
        db.get().collection(collection.productcollection).insertOne(product).then((data)=>{
            callback(data.ops[0]._id)
        })
    },
    getAllProduct:()=>{
        return new Promise(async(resolve,reject)=>{
         let product=await db.get().collection(collection.productcollection).find().toArray()
         resolve(product)
        }
        )},
    getOneproduct:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.productcollection).findOne({_id:objectid(id)}).then((product)=>{
                resolve(product)
            })
        }
        )
    },
    getDeleteProduct:(id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.productcollection).removeOne({_id:objectid(id)}).then((product)=>{
                resolve(product)
            })
        }
        )
    },
    getEditProduct:(id,data)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.productcollection).updateOne({_id:objectid(id)},{$set:{name:data.name,price:data.price}}).then((product)=>{
                resolve(product)
            })
    })},
    addtocart:(proid,userid)=>{
        let proObj={
            item:objectid(proid),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let usercart=await db.get().collection(collection.cartcollection).findOne({user:objectid(userid)})
            if(usercart){
                let Proexist=usercart.products.findIndex(product=> product.item==proid)
                if(Proexist!=-1){
                    db.get().collection(collection.cartcollection).updateOne({user:objectid(userid),'products.item':objectid(proid)},{$inc:{'products.$.quantity':1}})
                }
                else
                db.get().collection(collection.cartcollection).updateOne({user:objectid(userid)},{$push:{products:proObj}})
            }
            else{
                let cartobj={
                    user:objectid(userid),
                    products:[proObj]
                }
                db.get().collection(collection.cartcollection).insertOne(cartobj).then((response)=>resolve())
            }

            })
    },

    viewcart:async(userid)=>{
            let usercart=await db.get().collection(collection.cartcollection).findOne({user:objectid(userid)})
        return new Promise(async(resolve,reject)=>{
            if(usercart && (usercart.products.length!=0))
            {
            let cartitems=await db.get().collection(collection.cartcollection).aggregate([
                {
                    $match:{user:objectid(userid)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.productcollection,
                        localField:'item',
                        foreignField:'_id',
                        as:'products'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        products:{$arrayElemAt:['$products',0]},
                        

                    },
                    
                    
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        products:1,
                        netprice:{$multiply:['$quantity','$products.price']},

                    },
                },
               
                


            ]).toArray()
            let totalprice=await db.get().collection(collection.cartcollection).aggregate([
                {
                    $match:{user:objectid(userid)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.productcollection,
                        localField:'item',
                        foreignField:'_id',
                        as:'products'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        products:{$arrayElemAt:['$products',0]},
                        

                    },
                    
                    
                },
                {
                    $group:{
                        _id:null,
                        
                        total:{$sum:{$multiply:['$quantity','$products.price']}},

                    },
                },
               
                


            ]).toArray()

             let carttotal=(totalprice[0].total)
               resolve({cartitems,carttotal})
        }
            else{
                carttotal=null
                cartitems=null
                resolve({cartitems,carttotal})
            }})
            
    },
    removecartproduct:(proid,userid)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.cartcollection).updateOne({user:objectid(userid)},{$pull:{'products':{item:objectid(proid)}}}).then((product)=>{
                resolve(product)
            

            })

    })},
    changequantity:(cartid,proid,count,quantity)=>{
        count=parseInt(count)
        quantity=parseInt(quantity)
        if (count==-1 && quantity==1){
            return new Promise(async(resolve,reject)=>{
                db.get().collection(collection.cartcollection).updateOne({_id:objectid(cartid)},{$pull:{'products':{item:objectid(proid)}}}).then((product)=>{
                    resolve({emptycart:true})})})
                
        }
        else{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.cartcollection).updateOne({_id:objectid(cartid),'products.item':objectid(proid)},{$inc:{'products.$.quantity':count}}).then((product)=>{
                resolve(product)
            

            })}

    )}},

placeorder:(orderdetails,user,cart)=>{
        
        let status=(orderdetails['payment-method'])==='COD'?'Placed successfully':'Pending'
        let orderObj={
            deliverydetails:orderdetails,
            product:cart,
            user:user._id,
            paymentmethod:orderdetails['payment-method'],
            totalAmount:cart.carttotal,
            status:status,
            date:new Date()
        }
        
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.ordercollection).insertOne(orderObj).then((data)=>{
                let orderid=data.ops[0]._id
                db.get().collection(collection.cartcollection).removeOne({user:objectid(user._id)})
                resolve({orderid,status})
            })
            })
    },

    Allorderdetails:async(userid)=>{
    return new Promise(async(resolve,reject)=>
    {
        
        let orderdetails=await db.get().collection(collection.ordercollection).find({user:userid}).toArray()
        if(orderdetails){
        resolve(orderdetails)}
        else{
            resolve(null)
        }
    }
    
    )},

    orderdetails:async(orderid)=>{
        return new Promise(async(resolve,reject)=>
        {
            let orderdetails=await db.get().collection(collection.ordercollection).findOne({_id:objectid(orderid)})
            resolve(orderdetails)
        }
        
        )},

    cartquantity:async (userid)=>{
        console.log("hello")
        let usercart=await db.get().collection(collection.cartcollection).findOne({user:objectid(userid)})
        return new Promise(async(resolve,reject)=>{
            
            if(usercart && (usercart.products.length!=0))
            {
            let totalquantity=await db.get().collection(collection.cartcollection).aggregate([
                {
                    $match:{user:objectid(userid)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        quantity:'$products.quantity'
                    }
                },
                {
                    $group:{_id:null,
                    total:{$sum:'$quantity'}}
                }
                
            ]).toArray()
           
            console.log(totalquantity)
            resolve(totalquantity[0].total)
            }else{
                let empty=0
                resolve(empty)
            }
        
        })
    }

}