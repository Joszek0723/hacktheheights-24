from dotenv import load_dotenv
import os
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
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
    auth_response = supabase.auth.sign_in_with_password({
        "email": credentials.email,
        "password": credentials.password
    })

    if not auth_response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")

    session = auth_response.session

    # set the token in an HTTP-only cookie
    response = JSONResponse(content={"message": "Login sucessful"})
    response.set_cookie(
        key="access_token",
        value=session.access_token,
        httponly=True,
        secure=True,
        samesite="Strict"
    )
    return response
    
@app.post("/sign-up")
async def sign_up(user: SignUpRequest):
    auth_response = supabase.auth.sign_up({
        "email": user.email,
        "password": user.password,
    })
     
    #  session = auth_response.session
    if auth_response.user is None:
        raise HTTPException(status_code=400, detail="Sign up failed.")
     
    # insert the user into the users table
    db_response = supabase.table("users").insert({
        "email": user.email,
        "name": user.name,
        "role": "buyer"
    }).execute()

    if db_response.data is None:
        raise HTTPException(status_code=500, detail="Failed to create user in the database.")
     
    response = JSONResponse(content={"message": "Sign up successful! Please verify your email."})
    #  response.set_cookie(
    #       key="access_token",
    #       value=session.access_token,
    #       httponly=True,
    #       secure=True,
    #       samesite="Strict"
    #  )
    return response

@app.get("/email-confirmation")
async def email_confirmation(request: Request):
    print("HELLLLLLLOOOOOOOOOOOOOO")
    access_token = request.query_params.get("acess_token")

    if not access_token:
        raise HTTPException(status_code=400, detail="Missing access token.")
    
    auth_response = supabase.auth.get_user(access_token)

    if not auth_response.user:
        raise HTTPException(status_code=401, detail="Invalid or expired access token.")
    
    response = RedirectResponse(url="/dashboardNew.html")
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="Strict"
    )

    return response

app.mount("/", StaticFiles(directory="docs", html=True), name="docs") 