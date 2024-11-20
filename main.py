from dotenv import load_dotenv
import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"], 
)

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str

class SignInRequest(BaseModel):
    email: str
    password: str

@app.get("/")
async def root():
    return FileResponse("docs/index.html")

@app.get("/test")
async def test_endpoint():
    print("Test endpoint was hit!")
    return {"message": "Test endpoint is working"}

@app.post("/sign-in")
async def sign_in(credentials: SignInRequest):
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })

        return JSONResponse(
            content={
                "user": {
                    "id": auth_response.user.id,
                    "email": auth_response.user.email
                }, 
                "session": {
                    "access_token": auth_response.session.access_token,
                    "refresh_token": auth_response.session.refresh_token,
                    "token_type": auth_response.session.token_type
                }
            },
            status_code=200
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# @app.get("/verify-user")
# async def verify_user(authorization: str = Header(None)):
#     try:
#         if not authorization or not authorization.startswith("Bearer "):
#             raise HTTPException(status_code=401, detail="Unauthorized")

#         jwt = authorization.split("Bearer ")[1]
#         print(jwt)

#         response = supabase.auth.get_user()
#         print(response)

#         if response.user is None:
#             raise HTTPException(status_code=401, detail="Unauthorized")

#         return {"user": response.user}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/verify-user")
# async def verify_user():
#     try:
#         response = supabase.auth.get_user()
#         print(response)

#         if response.user is None:
#             raise HTTPException(status_code=401, detail="Unauthorized")

#         return {"user": response.user}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

@app.post("/verify-user")
async def verify_user(request: Request):
    try:
        # Parse the request body to get the access token
        body = await request.json()
        access_token = body['access_token']
        print(access_token)

        if not access_token:
            raise HTTPException(status_code=400, detail="Access token is required")

        # Use the access token to fetch the user
        response = supabase.auth.get_user(access_token)
        print(response.user)

        if response.user is None:
            raise HTTPException(status_code=401, detail="Unauthorized")

        return {"user": response.user}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    

@app.post("/sign-out")
async def sign_out():
    try:
        response = supabase.auth.sign_out()
        print(response)
        return {"message": "Successfully signed out"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error signing out: {str(e)}")
    
@app.post("/sign-up")
async def sign_up(credentials: SignUpRequest):
    try:
        authresponse = supabase.auth.sign_up({
            "email": credentials.email,
            "password": credentials.password,
            "options": {
                "email_redirect_to": "http://127.0.0.1:8000/dashboardNew.html",
            },
        })

        if authresponse.user is None:
            raise HTTPException(status_code=400, detail="Sign up failed.")

        db_response = supabase.table("users").insert({
            "email": credentials.email,
            "name": credentials.name,
            "role": "buyer",
        }).execute()

        if db_response.data is None:
            raise HTTPException(status_code=500, detail="Failed to create user in the database.")
     
        response = JSONResponse(content={"message": "Sign up successful! Please verify your email."})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


app.mount("/", StaticFiles(directory="docs", html=True), name="docs") 

