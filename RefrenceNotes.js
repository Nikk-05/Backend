// Aggregation pipeline in mongoDB.
// Aggreation pipeline consist of one or more stages that process documents
// Each stage perform an operation on the input document.
// Syntax: db.orders.aggregate([

// { $match: { status: "shipped" }}, // Stage 1. Filtering shipped order
// { $group: { _id: "$customer_id", total_amount: { $sum: "$amount" } } }, // Stage 2. Grouping the filtered documents by customer id and total amount of order
// { $sort: { total_amount: -1 } },
// { $limit: 10 }])
// // for join aggregation pipeline
// [
//     {
//         $lookup: {
//             from: "customers", // from where data should be fetched
//             localField: "customer_id", // which field is unique for this pipeline
//             foreignField: "_id", // what is field name in other pipeline 
//             as: "customer_details" // alias  for returning field
//         },
//         {
//             $addFields:{
//                 customer_details:{
//                     $first: ""
//                 }
//             }
//         }
//     }
// ]
// Read and learn about aggregation pipeline.
//-----------------Big Picture---------------------//
/*
Create function for forget password
Delete the registered user

*/