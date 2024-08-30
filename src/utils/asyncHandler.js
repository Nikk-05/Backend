const asyncHandler = (requestHandler) => {
    return (response, request, next) => {
        Promise.resolve(requestHandler(response, request, next)).
        catch((error) => next(error))
    }
}
export {asyncHandler}

// const asyncHandler = (requestHandler) => async(request, response, next) =>{
//     try{
//         await requestHandler(request, response, next)
//     }
//     catch(error){
//         response.status(error.code || 500).json({
//             success: false,
//             message: error.message || "Server Error"
//         })
//     }
// }
