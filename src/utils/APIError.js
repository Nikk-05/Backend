class APIError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong !",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode,
        this.data = null,
        this.errors = errors,
        this.success = false

        // This is use to trace tha Stack of the error.
        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {APIError}