import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function Home() {
    
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect('/LoginPage');
  }

  const payload = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64').toString()
  );

  if (payload.role === "admin") {
    redirect('/admin');
  }

  redirect('/client');
}
