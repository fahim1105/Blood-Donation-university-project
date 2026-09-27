# 🩸 Blood Donation Management System

A full-stack web application for managing blood donation requests, connecting donors with recipients, and tracking donation history.

## 🌟 Features

- **User Registration & Authentication** - Firebase-based secure authentication
- **Blood Request Management** - Post and manage blood donation requests
- **Donor Search** - Search donors by blood type and location
- **Direct Requests** - Send direct donation requests to specific donors
- **Email Notifications** - Automated email notifications for requests
- **Donation History** - Track and view donation history
- **Real-time Updates** - Live status updates for requests
- **Geolocation Support** - Location-based donor matching

## 🛠️ Tech Stack

### Backend
- **Java 21** with Spring Boot 3.5.3
- **Spring Security** with Firebase Authentication
- **MongoDB Atlas** for data persistence
- **JavaMailSender** for email notifications
- **Docker** for containerization

### Frontend
- **React.js** with modern hooks
- **Firebase Authentication**
- **Axios** for API calls
- **React Router** for navigation
- **Responsive Design**

## 🚀 Quick Start

### Prerequisites
- Java 21
- Maven 3.8+
- Node.js 18+
- MongoDB Atlas account
- Firebase project

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/blood-donation.git
cd blood-donation
```

2. **Configure Firebase**
   - Place your `blood-donation-admin-SDK.json` in `src/main/resources/`
   - Update Firebase config in `application.properties`

3. **Run Backend**
```bash
./mvnw spring-boot:run
```
Backend runs on: http://localhost:8080

4. **Run Frontend** (in new terminal)
```bash
cd frontend-implementation
npm install
npm start
```
Frontend runs on: http://localhost:3000

## 🌐 Deployment

### Deploy to Render (Free)

Full deployment guide: [RENDER_DEPLOYMENT_GUIDE.md](RENDER_DEPLOYMENT_GUIDE.md)

Quick steps:
1. Push code to GitHub
2. Connect repository to Render
3. Configure environment variables
4. Deploy!

Your app will be live at: `https://your-app.onrender.com`

## 📁 Project Structure

```
blood-donation/
├── src/main/java/com/example/blood_donation/
│   ├── controller/       # REST API endpoints
│   ├── service/          # Business logic
│   ├── model/            # Data models
│   ├── repository/       # Database access
│   ├── security/         # Authentication & authorization
│   ├── dto/              # Data transfer objects
│   └── config/           # Application configuration
├── src/main/resources/
│   ├── templates/        # Thymeleaf templates
│   ├── application.properties
│   └── application-prod.properties
├── frontend-implementation/
│   └── src/
│       ├── components/   # React components
│       ├── services/     # API services
│       └── contexts/     # React contexts
├── Dockerfile
├── render.yaml
└── pom.xml
```

## 🔑 Environment Variables

Required for production:
```env
SPRING_PROFILES_ACTIVE=prod
PORT=8080
JAVA_OPTS=-Xmx512m -XX:+UseContainerSupport
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Blood Requests
- `GET /api/blood-requests` - Get all requests
- `POST /api/blood-requests` - Create new request
- `PUT /api/blood-requests/{id}` - Update request
- `DELETE /api/blood-requests/{id}` - Delete request

### Users
- `GET /api/users/search` - Search donors
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/location` - Update location

### Direct Requests
- `POST /api/direct-requests` - Send direct request
- `GET /api/direct-requests/donor` - Get donor's requests
- `PUT /api/direct-requests/{id}/respond` - Respond to request

## 🔒 Security

- Firebase JWT token authentication
- Rate limiting (50 requests/minute)
- CORS configuration for frontend
- Secure password handling
- Input validation

## 📧 Email Notifications

Automated emails for:
- New blood requests
- Direct donation requests
- Request status updates
- Donor matches

## 🐛 Troubleshooting

### Common Issues

**Build fails:**
- Check Java version: `java -version` (should be 21)
- Clear Maven cache: `./mvnw clean`

**MongoDB connection error:**
- Verify MongoDB Atlas connection string
- Check IP whitelist in Atlas

**Email not sending:**
- Verify Gmail app password
- Check SMTP settings

**Render deployment fails:**
- Check build logs in Render dashboard
- Verify Dockerfile configuration
- Check environment variables

## 📊 Monitoring

Health check endpoint: `/actuator/health`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Firebase for authentication
- MongoDB Atlas for database
- Render for hosting
- Spring Boot community

## 📞 Support

For support, email: hemo.blood.donation.web.service@gmail.com

---

**Made with ❤️ for saving lives through blood donation**
