import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, 'C:/Users/sedki/Desktop/NextRH/nextrh-backend/.env') });

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);

auth.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

async function test() {
  try {
    console.log("CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);
console.log("REFRESH_TOKEN:", process.env.GOOGLE_REFRESH_TOKEN);
    const token = await auth.getAccessToken();
    console.log("OK TOKEN:", token);
  } catch (e: any) {
    console.error("ERROR:", e.response?.data || e.message);
  }
}

test();