from dotenv import load_dotenv
import os
from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re

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

# class EventListing(BaseModel):
#     title: str
#     event_date: str
#     number_of_tickets: int
#     price: float
#     venue: str

# Pydantic model for input validation
class Listing(BaseModel):
    category: str
    title: str
    price: float
    event_date: str = None
    venue: str = None
    # more fields to be added


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

@app.post("/verify-user")
async def verify_user(authorization: str = Header(...)):
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header format.")
        access_token = authorization.split(" ")[1]
        response = supabase.auth.get_user(access_token)
        if response.user is None:
            raise HTTPException(status_code=401, detail="Unauthorized")
        sub = response.user.user_metadata['sub']
        email = response.user.user_metadata['email']
        user_query = supabase.table("users").select("*").eq("email", email).execute()
        if not user_query.data:
            raise HTTPException(status_code=404, detail="User not found in the database.")
        user_data = user_query.data[0]
        print(user_data)
        if not user_data.get("supabase_auth_id"):
            supabase.table("users").update({"supabase_auth_id": sub}).eq("email", email).execute()
        return {"user": response.user, "name": user_data["name"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sign-out")
async def sign_out():
    try:
        response = supabase.auth.sign_out()
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
                "email_redirect_to": "https://thehandel.co/dashboard",
            },
        })

        if authresponse.user is None:
            raise HTTPException(status_code=400, detail="Sign up failed.")

        db_response = supabase.table("users").insert({
            "email": credentials.email,
            "name": credentials.name
        }).execute()

        if db_response.data is None:
            raise HTTPException(status_code=500, detail="Failed to create user in the database.")
     
        response = JSONResponse(content={"message": "Sign up successful! Please verify your email."})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@app.post("/create-listing")
async def create_listing(listing: Listing, authorization: str = Header(...)):
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header format.")
        
        access_token = authorization.split(" ")[1]
        user_metadate = supabase.auth.get_user(access_token).user.user_metadata
        sub = user_metadate['sub']

        parent_insert_response = supabase.table("listings").insert({
            "title": listing.title,
            "price": listing.price,
            "posted_by": sub,
            "category": listing.category
        }).execute()

        if not parent_insert_response.data:
            raise HTTPException(status_code=500, detail="Failed to insert into listings.")
        parent_id = parent_insert_response.data[0]["id"]

        if listing.category == "tickets":
            supabase.table("tickets").insert({
                "listing_id": parent_id,
                "event_date": listing.event_date,
                "venue": listing.venue
            }).execute()
        else:
            raise HTTPException(status_code=400, detail="Invalid category specified.")
        
        return {"message": "Listing created successfully."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))        

    
# @app.post("/create-event-listing")
# async def create_event_listing(listing: EventListing, authorization: str = Header(...)):
#     try:
#          # Extract JWT from Authorization header
#         if not authorization.startswith("Bearer "):
#             raise HTTPException(status_code=401, detail="Invalid authorization header format.")

#         access_token = authorization.split(" ")[1]

#         sub = supabase.auth.get_user(access_token).user.user_metadata['sub']

#         response = supabase.table("event_listings").insert({
#             "title": listing.title,
#             "event_date": listing.event_date,
#             "number_of_tickets": listing.number_of_tickets,
#             "price": listing.price,
#             "venue": listing.venue,
#             "posted_by": sub
#         }).execute()
#         return {"message": "Event listing created successfully."}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))



# @app.get("/get-listings")
# async def get_listings():
#     try:
#         response = supabase.rpc("get_listings").execute()
#         listings = response.data

#         return {"listings": listings}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-listings")
async def get_listings():
    try:
        parent_listings = supabase.table("listings").select("*").execute().data

        tickets = {ticket["listing_id"]: ticket for ticket in supabase.table("tickets").select("*").execute().data}
        # books = {book["listing_id"]: book for book in supabase.table("books").select("*").execute().data}
        # spaces = {space["listing_id"]: space for space in supabase.table("spaces").select("*").execute().data}
        # items = {item["listing_id"]: item for item in supabase.table("items").select("*").execute().data}

        users = {user["supabase_auth_id"]: user for user in supabase.table("users").select("supabase_auth_id, name").execute().data}

        listings = []
        for listing in parent_listings:
            category = listing["category"]
            category_data = None

            if category == "tickets" and listing["id"] in tickets:
                category_data = tickets[listing["id"]]
            # elif category == "books" and listing["id"] in books:
            #     category_data = books[listing["id"]]
            # elif category == "spaces" and listing["id"] in spaces:
            #     category_data = spaces[listing["id"]]
            # elif category_data == "items" and listing["id"] in items:
            #     category_data = items[listing["id"]]

            # Attach poster details
            poster = users.get(listing["posted_by"], {})
            poster_name = poster.get("name", "Unknown")
            poster_uuid = listing["posted_by"]

            # Merge parent, category-specific, and poster data
            combined_data = {
                **listing,
                **(category_data or {}),
                "poster_uuid": poster_uuid,
                "poster_name": poster_name
            }
            listings.append(combined_data)
        return {"listings": listings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# app.mount("/", StaticFiles(directory="docs", html=True), name="docs") 
app.mount("/static", StaticFiles(directory="static"), name="static")

# Directory where HTML files are stored
HTML_DIR = "templates"  # Update to match your directory

@app.get("/")
async def root():
    # Securely resolve the path to index.html
    file_path = os.path.abspath(os.path.join(HTML_DIR, "index.html"))

    # Ensure the resolved path stays within the HTML_DIR
    if not file_path.startswith(os.path.abspath(HTML_DIR)):
        raise HTTPException(status_code=403, detail="Access denied")

    # Check if index.html exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Page not found")

    return FileResponse(file_path)

@app.get("/index")
@app.get("/index.html")
async def redirect_to_root():
    return RedirectResponse("/")

@app.get("/{page_name}")
async def serve_html(page_name: str):
    # Validate page_name with a regex
    if not re.match(r"^[a-zA-Z0-9_-]+$", page_name):
        raise HTTPException(status_code=400, detail="Invalid page name")

    # Resolve the path and ensure it is within the HTML_DIR
    safe_path = os.path.abspath(os.path.join(HTML_DIR, f"{page_name}.html"))
    if not safe_path.startswith(os.path.abspath(HTML_DIR)):
        raise HTTPException(status_code=403, detail="Access denied")

    # Check if the file exists
    if not os.path.exists(safe_path):
        raise HTTPException(status_code=404, detail="Page not found")

    return FileResponse(safe_path)