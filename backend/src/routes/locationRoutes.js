import express from 'express'
import { saveLocation, getLastLocation } from '../controllers/locationController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// ✅ Protect both routes
router.post('/update', protect, saveLocation)
router.get('/last/:userId', protect, getLastLocation)

export default router