# config.py
class Config:
    # Switched database name from faceAuthDB to FaceSure
    MONGO_URI = ""
    JWT_SECRET = ""

    SUPERADMINS = [
        {
            "_id": "superadmin",
            "password": "Super@123",
            "name": "Super Admin One",
            "phone": "9999999999"
        },
        {
            "_id": "superadmin2",
            "password": "Super@123",
            "name": "Super Admin Two",
            "phone": "8888888888"
        }
    ]
