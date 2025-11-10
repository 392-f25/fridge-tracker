import { signInWithGoogle, signOut, useAuthState } from '../utils/firebase'

export const Banner = () => {
  const { user } = useAuthState();

  return (
    <>
      <div className="relative flex items-center py-4 px-6">
        <span className="m-0 mb-3 text-2xl my-6 tracking-tight font-bold">
          Hi, { user ? user.displayName : 'guest' }!
        </span>
        <span className="ml-auto">
          {
            user
            ? <button type="button" className="px-4 py-2 bg-blue-100 text-gray-800 rounded-lg hover:bg-gray-200 transition" onClick={signOut}>Sign Out</button>
            : <button type="button" className="px-4 py-2 bg-blue-100 text-gray-800 rounded-lg hover:bg-gray-200 transition" onClick={signInWithGoogle}>Sign In</button>
          }
        </span>
      </div>
      <hr className="my-4" />
    </>
  );
};