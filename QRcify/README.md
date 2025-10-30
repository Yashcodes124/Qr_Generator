# QRGen Pro - Secure QR Code Generator

![QRGen Pro](https://img.shields.io/badge/QRGen-Pro-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Express](https://img.shields.io/badge/Express-4.x-blue)
![SQLite](https://img.shields.io/badge/SQLite-3.x-lightgrey)

A professional, full-stack QR code generator with military-grade encryption capabilities. Create secure QR codes for URLs, encrypted messages, files, contact cards, and WiFi credentials.

## 🚀 Features

### 🔐 Security Features
- **Military-grade AES-256 encryption** with PBKDF2 key derivation
- **Salt and IV generation** for enhanced security
- **Secure file encryption** with automatic size optimization
- **Passphrase-protected** QR code access

### 📱 QR Code Types
- **🔗 URL QR Codes** - Quick website links
- **🔒 Encrypted Text** - Secure message sharing
- **📁 File Encryption** - Encrypt and share files via QR
- **📇 vCard QR** - Digital business cards
- **📶 WiFi QR** - Easy network sharing
- **📊 Analytics** - Track QR generation statistics

### 💻 Technical Highlights
- **Responsive Design** - Works on all devices
- **Real-time Processing** - Instant QR generation
- **Rate Limiting** - API abuse protection
- **Error Handling** - Comprehensive error management
- **Modern UI/UX** - Professional interface with smooth animations

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database (with Sequelize ORM)
- **CryptoJS** - Encryption library
- **QR-Image** - QR code generation
- **Express Rate Limit** - API security

### Frontend
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern styling with gradients and animations
- **HTML5** - Semantic markup
- **FileReader API** - Client-side file handling

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/qrgen-pro.git
   cd qrgen-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment** (optional)
   ```bash
   # Create .env file for custom configuration
   cp .env.example .env
   ```

4. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## 🎯 Usage Guide

### Basic URL QR Generation
1. Enter any URL in the "Basic QR Generator" section
2. Click "Generate QR Code"
3. Scan the QR with any smartphone camera

### Secure Text Encryption
1. Enter your secret message in the "Secure Text QR" section
2. Set a strong passphrase
3. Generate the encrypted QR code
4. Share the QR - recipients need the passphrase to decrypt

### File Encryption
1. Upload any file (images, documents, etc.)
2. Set an encryption passphrase
3. For large files, the system automatically provides download links
4. Recipients can decrypt using the same passphrase

### vCard QR Codes
1. Fill in contact information (name and phone required)
2. Generate a digital business card QR
3. Others can scan to save your contact instantly

### WiFi QR Codes
1. Enter your network SSID and password
2. Select encryption type (WPA/WPA2, WEP, or open)
3. Generate QR for easy network sharing

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate` | Generate basic URL QR code |
| POST | `/api/generate-encryptedText` | Create encrypted text QR |
| POST | `/api/encrypt-file` | Encrypt files and generate QR |
| POST | `/api/decrypt` | Decrypt text messages |
| POST | `/api/decrypt-file` | Decrypt files |
| POST | `/api/generate-vcard` | Generate vCard QR codes |
| POST | `/api/generate-wifi` | Generate WiFi QR codes |
| GET | `/api/stats` | Get QR generation statistics |

## 🗂 Project Structure

```
QRcify/
├── backend/
│   ├── config/
│   │   ├── config.js          # Application configuration
│   │   └── database.js        # Database connection
│   ├── models/
│   │   └── QRHistory.js       # Database model for analytics
│   ├── routes/
│   │   └── mainRoutes.js      # API route handlers
│   ├── services/
│   │   └── historyService.js  # Business logic for analytics
│   ├── utils/
│   │   └── cryptoUtils.js     # Encryption utilities
│   └── index.js               # Server entry point
├── frontend/
│   ├── index.html             # Main application page
│   ├── main.css               # Professional styling
│   └── script.js              # Frontend functionality
├── database/
│   └── qr_generator.sqlite    # SQLite database (auto-created)
└── package.json
```

## 🔒 Security Implementation

### Encryption Details
- **Algorithm**: AES-256
- **Key Derivation**: PBKDF2 with 10,000 iterations
- **Salt**: 128-bit random salt per encryption
- **IV**: 128-bit random initialization vector
- **Output Format**: `salt::iv::ciphertext`

### Security Features
- Rate limiting (50 requests per 15 minutes per IP)
- Input validation and sanitization
- Secure file handling
- No sensitive data logging

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
```bash
npm start
```

### Environment Variables
```env
PORT=3000
MAX_FILE_SIZE=50mb
NODE_ENV=production
```

## 🤝 Contributing

We welcome contributions! Please feel free to submit pull requests or open issues for bugs and feature requests.

### Development Setup
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Performance

- **QR Generation**: < 100ms
- **File Encryption**: Depends on file size
- **Database Operations**: < 50ms
- **Concurrent Users**: 100+ with rate limiting

## 🐛 Troubleshooting

### Common Issues

1. **QR code not scanning**
   - Ensure sufficient contrast
   - Increase image size if needed
   - Check for URL validity

2. **Decryption fails**
   - Verify correct passphrase
   - Ensure complete ciphertext
   - Check for special character issues

3. **File upload issues**
   - Check file size limits (50MB default)
   - Verify file type compatibility
   - Ensure stable internet connection

### Getting Help
- Check the browser console for error messages
- Review server logs for backend issues
- Ensure all dependencies are installed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **QR-Image** - For reliable QR code generation
- **CryptoJS** - For robust encryption capabilities
- **Express.js** - For the excellent web framework
- **Sequelize** - For simple database management

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check existing documentation
- Review the troubleshooting section

---

**QRGen Pro** - Your secure QR code solution for the modern web. 🔐✨

*Built with ❤️ for the developer community.*