# Tap2Order - Complete Restaurant Ordering System

![Tap2Order Banner](public/T2O.png)

> A comprehensive SaaS platform that digitizes restaurant operations with QR menu ordering, multi-dashboard management, real-time synchronization, and advanced analytics for modern restaurants.

[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Site-blue)](https://tap2orders.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000)](https://vercel.com)
[![Production Ready](https://img.shields.io/badge/Status-Production_Ready-green)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue)]()

## 🌟 Overview

Tap2Order is a modern restaurant management platform designed to transform traditional dining experiences into digital-first operations. Built for Indian restaurants, it offers complete digitization from customer ordering to kitchen management, billing, and business analytics.

### ✨ Key Highlights
- **Contactless Ordering**: QR code-based menu scanning for seamless customer experience
- **Multi-Tenant SaaS**: Isolated restaurant data with shared infrastructure
- **Real-Time Sync**: Live updates across waiter, kitchen, and owner dashboards
- **GST Compliance**: Built-in tax calculations with CGST/SGST breakdown
- **Role-Based Access**: Dedicated interfaces for owners, waiters, chefs, and admins

## 🚀 Features

### Core Features
- **📱 QR Menu System**: Digital menu with cart functionality, size options, and real-time ordering
- **👥 Multi-Dashboard Management**: Separate interfaces for hotel owners, waiters, and chefs
- **📊 Advanced Analytics**: 18+ metrics including revenue trends, peak hours, and menu performance
- **🍽️ Order Management**: Individual item status tracking with beverages workflow bypass
- **🧾 Billing & GST**: Sequential bill numbering, thermal printer integration, and tax compliance
- **👨‍🍳 Kitchen Workflow**: Real-time order updates with preparation status tracking
- **📋 Menu Management**: CRUD operations with categories, sizes, and availability controls

### Technical Features
- **🔐 Multi-Tenant Security**: Complete data isolation between restaurants
- **⚡ Real-Time Updates**: Ably WebSocket integration for live synchronization
- **📱 Responsive Design**: Mobile-first approach from 320px to 2560px+
- **🔒 Authentication**: NextAuth.js with JWT support and role-based access
- **📈 Performance**: Server-side rendering, optimized queries, and caching
- **🖨️ Thermal Printing**: QZ Tray integration for professional receipts

### Unique Selling Points
- **Beverages Optimization**: Direct-to-served workflow for drinks bypassing kitchen delays
- **Individual Item Tracking**: Granular status control for complex order management
- **Staff-Centric Design**: Role-specific dashboards with appropriate permissions
- **Compliance-Ready**: GST, FSSAI, and business profile management
- **Scalable Architecture**: From single restaurant to multi-outlet chains

## 🏗️ Architecture

```
Tap2Order/
├── app/                          # Next.js App Router
│   ├── api/                     # API Routes (30+ endpoints)
│   ├── admin/                   # Admin Dashboard
│   ├── analytics/               # Business Intelligence
│   ├── dashboard/               # Owner Dashboard
│   ├── kitchen/                 # Chef Interface
│   ├── waiter/                  # Waiter Interface
│   ├── menu/                    # Menu Management
│   └── qr/[tableId]/            # Customer QR Menu
├── models/                      # MongoDB Schemas
│   ├── User.js                  # Hotel owners with GST details
│   ├── Order.js                 # Orders with item-level status
│   ├── MenuItem.js              # Menu with pricing structures
│   ├── Staff.js                 # Staff with roles and passcodes
│   └── ...
├── components/                  # Reusable UI Components
│   ├── dashboard/               # Dashboard-specific components
│   ├── qr/                      # QR menu components
│   └── ...
├── lib/                         # Utilities and Services
│   ├── auth-middleware.js       # Authentication helpers
│   ├── thermalPrinter.js        # Printer integration
│   └── ...
└── public/                      # Static Assets
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.3.2 with App Router
- **UI Library**: React 19
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: React Icons, Lucide React

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Database**: MongoDB 7.0 with Mongoose ODM
- **Authentication**: NextAuth.js with JWT
- **Real-Time**: Ably WebSocket
- **File Upload**: Built-in Next.js handling

### DevOps & Tools
- **Deployment**: Vercel
- **Version Control**: Git
- **Package Manager**: npm
- **Code Quality**: ESLint, Prettier
- **Environment**: Node.js environment variables

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js**: Version 18.x or higher
- **MongoDB**: Version 7.0 or higher (local or cloud)
- **npm**: Version 9.x or higher
- **Git**: For version control

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shankar20024/tap2order.git
   cd tap2order
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/tap2order

   # Authentication
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000

   # Real-Time (Ably)
   ABLY_API_KEY=your-ably-api-key

   # Other Services
   # Add other required environment variables
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB locally or use cloud service
   mongod
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser
   - Access admin panel at `/admin`
   - QR menu at `/qr/[tableId]`

## 📖 Usage

### For Restaurant Owners
1. **Register/Login**: Create account and set up business profile
2. **Configure Menu**: Add menu items with categories, prices, and sizes
3. **Set Up Tables**: Configure table layout and QR codes
4. **Manage Staff**: Add staff members with roles and permissions
5. **Monitor Operations**: Use dashboard for real-time order tracking
6. **View Analytics**: Access business insights and performance metrics

### For Customers
1. **Scan QR Code**: Use camera to scan table QR code
2. **Browse Menu**: View categorized menu with photos and descriptions
3. **Add to Cart**: Select items, quantities, and special instructions
4. **Place Order**: Submit order with customer details
5. **Track Status**: Receive real-time updates on order progress
6. **Receive Bill**: Get digital receipt upon payment completion

### For Staff
1. **Login**: Use assigned passcode or credentials
2. **Access Dashboard**: Role-specific interface (waiter/kitchen/manager)
3. **Manage Orders**: Update status, prepare items, coordinate service
4. **Handle Payments**: Mark orders paid and print receipts

## 🔧 Configuration

### Menu Categories
- **Veg**: Vegetarian items (green indicator)
- **Non-Veg**: Non-vegetarian items (red indicator)
- **Jain**: Jain-friendly options (orange indicator)

### Staff Roles
- **Manager**: Full dashboard access
- **Waiter**: Order management and customer service
- **Chef**: Kitchen operations and food preparation

### GST Configuration
- Configure tax rates in business profile
- Automatic CGST/SGST calculation
- Compliance with Indian tax regulations

## 🧪 Testing

### Running Tests
```bash
npm test
```

### API Testing
- Use Postman or similar tools
- Import the API collection from `/docs/api.postman_collection.json`
- Test endpoints with proper authentication

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Menu item CRUD operations
- [ ] QR code generation and scanning
- [ ] Order placement and status updates
- [ ] Real-time synchronization
- [ ] Billing and GST calculations
- [ ] Staff authentication and role access


## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Maintain mobile-first responsive design


## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
```
Error: MongoServerError: bad auth
```
- Check MongoDB credentials in environment variables
- Ensure MongoDB is running locally or cloud service is accessible

**Real-Time Updates Not Working**
- Verify Ably API key is correctly set
- Check network connectivity for WebSocket connections
- Ensure proper channel naming (`orders:{hotelId}`)

**Authentication Issues**
- Clear browser cache and cookies
- Verify NextAuth configuration
- Check JWT token expiration

**QR Code Not Scanning**
- Ensure camera permissions are granted
- Test with different QR code readers
- Verify table ID format in URL

## 📊 Performance

### Optimization Features
- **Server-Side Rendering**: Fast initial page loads
- **Image Optimization**: Next.js automatic image optimization
- **Database Indexing**: Optimized MongoDB queries
- **Caching**: API response caching where applicable
- **Bundle Splitting**: Code splitting for better loading times

### Metrics
- **Lighthouse Score**: 95+ on desktop, 90+ on mobile
- **API Response Time**: <200ms for most endpoints
- **Real-Time Latency**: <50ms for Ably events
- **Bundle Size**: Optimized with tree shaking

## 🔒 Security

### Authentication & Authorization
- **Multi-Tenant Isolation**: Complete data separation between hotels
- **Role-Based Access Control**: Permission-based feature access
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Secure session handling with NextAuth

### Data Protection
- **Input Validation**: Comprehensive validation on all inputs
- **SQL Injection Prevention**: Parameterized queries with Mongoose
- **XSS Protection**: Sanitized user inputs and outputs
- **CSRF Protection**: Built-in NextAuth CSRF protection

## 📈 Roadmap

### Upcoming Features
- [ ] **Mobile Apps**: Native iOS/Android apps for staff
- [ ] **Payment Integration**: Direct payment processing
- [ ] **Loyalty Program**: Customer rewards and points system
- [ ] **Inventory Management**: Stock tracking and alerts
- [ ] **Multi-Language Support**: Localization for different regions
- [ ] **Advanced Analytics**: Predictive analytics and AI insights
- [ ] **API SDK**: Developer tools for third-party integrations


## 📞 Support

### Getting Help
- **Email**: [shankarpradhan2004@gmail.com](mailto:shankarpradhan2004@gmail.com)
- **GitHub Issues**: Report bugs and request features
- **Telegram**: [Join Telegram Group](https://t.me/Shankar8090)
- **Twitter (X)**: [Follow on Twitter](https://x.com/shankarpra17366)

### Community
- **GitHub**: [https://github.com/shankar20024/tap2order](https://github.com/shankar20024/tap2order)
- **Website**: [https://tap2orders.com](https://tap2orders.com)
- **LinkedIn**: [Shankar Pradhan](https://www.linkedin.com/in/shankar-pradhan-4b8967238)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **Vercel** for hosting and deployment platform
- **MongoDB** for the robust database solution
- **Ably** for real-time communication
- **Tailwind CSS** for utility-first styling
- **Open Source Community** for inspiration and tools

---

**Made with ❤️ for restaurants worldwide**

*Transform your restaurant operations with Tap2Order - where technology meets hospitality.*
