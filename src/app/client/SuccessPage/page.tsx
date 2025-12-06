'use client';

import { useSearchParams } from "next/navigation";

const SuccessPage = ()=>{
  const query = useSearchParams();
  const movie = query.get("movie");
  const user = query.get("user");
  const seats = query.get("seats");

  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold text-green-600">Payment Successful! 🎉</h1>

      <p className="mt-4">Movie ID: {movie}</p>
      <p>User ID: {user}</p>
      <p>Seats: {seats}</p>

      <p className="mt-6 text-gray-600">
        Your ticket has been confirmed.
      </p>
    </div>
  );
}

export default SuccessPage;