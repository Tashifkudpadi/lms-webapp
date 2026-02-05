# LMS Dashboard - Learning Management System

A comprehensive Learning Management System built with FastAPI (Backend) and Next.js (Frontend) for managing tests, students, faculties, batches, and courses.

## Features

### 🎓 Test Management
- **Multiple Test Types**: Support for UPSC and TNPSC exams
- **Test Categories**: Prelims (MCQ) and Mains (Descriptive) tests
- **Auto-Grading**: Automatic result calculation for Prelims tests with negative marking
- **Manual Evaluation**: Faculty can evaluate and grade Mains submissions
- **Question Import**: Bulk import questions from Excel files
- **PDF Support**: Upload question papers for Mains tests

### 👨‍🎓 Student Features
- **Test Attempts**: Interactive test-taking interface with timer
- **MCQ Tests**: Question navigator, answer selection, review before submit
- **Mains Tests**: Download question paper, upload answer file
- **Results Dashboard**: View scores, detailed answer review, solutions

### 👨‍🏫 Faculty Features
- **Test Creation**: Create and manage tests with detailed settings
- **Question Management**: Add, edit, delete questions individually or in bulk
- **Result Analysis**: View all student results with attempt status
- **Evaluation Tools**: Grade Mains submissions with remarks
- **Batch Management**: Assign tests to batches or individual students

### 📊 Admin Features
- **User Management**: Manage students, faculties, batches
- **Course Management**: Create and organize courses
- **Test Monitoring**: Track test attempts and results
- **Access Control**: Role-based permissions (Admin, Faculty, Student)

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database operations
- **PostgreSQL**: Primary database
- **Alembic**: Database migrations
- **MinIO**: S3-compatible object storage for files
- **JWT**: Authentication and authorization
- **Pydantic**: Data validation
- **Pandas**: Excel file processing

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Redux Toolkit**: State management
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Component library
- **Axios**: HTTP client

## Project Structure

```
lms-dashboard/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routers/        # API endpoints
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── utils/          # Utility functions
│   │   └── database.py     # Database configuration
│   ├── alembic/            # Database migrations
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # Next.js frontend
│   ├── app/               # App router pages
│   │   └── dashboard/     # Dashboard pages
│   ├── components/        # React components
│   ├── store/            # Redux store
│   └── utils/            # Utility functions
│
├── docker-compose.yml     # Docker orchestration
└── .gitignore            # Git ignore rules
```

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Tashifkudpadi/lms-webapp.git
   cd lms-webapp
   ```

2. **Create environment files**

   Backend `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:password@postgres:5432/lmsdb
   SECRET_KEY=your-secret-key-here
   MINIO_ENDPOINT=minio:9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   MINIO_BUCKET=lms-files
   ```

   Frontend `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - MinIO Console: http://localhost:9001

### Local Development

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Database Migrations

```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Key Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Tests
- `GET /tests` - List all tests
- `POST /tests` - Create test
- `GET /tests/{id}` - Get test details
- `POST /tests/{id}/start` - Start test attempt
- `POST /tests/{id}/submit/{attempt_id}` - Submit test
- `GET /tests/{id}/students-with-status` - Get students with attempt status

### Students
- `GET /students` - List students
- `POST /students` - Create student
- `GET /students/{id}` - Get student details

### Batches
- `GET /batches` - List batches
- `POST /batches` - Create batch

## Features Implementation

### Test Attempt Flow
1. Student clicks "Take Test" → Start screen with instructions
2. Click "Start Test" → Timer begins, questions displayed
3. Navigate through questions, select answers
4. Submit test → Auto-calculated results (Prelims) or pending evaluation (Mains)
5. View results with detailed answer review

### Result Calculation (Prelims)
- Correct answer: +marks assigned to question
- Wrong answer: -negative_marking value
- Unattempted: 0 marks
- Final score: Sum of all marks (minimum 0)
- Status: Automatically set to "EVALUATED"

### Mains Evaluation
1. Faculty uploads question paper PDF
2. Students download, solve, upload answer file
3. Faculty reviews submission
4. Faculty assigns score and remarks
5. Status changes to "EVALUATED"

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using FastAPI and Next.js
