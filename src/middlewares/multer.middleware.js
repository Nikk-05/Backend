import multer from 'multer'

// The disk storage engine gives you full control on storing files to disk.

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // What should be the file name
  }
})

export const upload = multer({ storage }) 