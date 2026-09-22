export default function RegisterPage() {
  return (
    <div>
      <h1>Register</h1>

      <input
        type="text"
        placeholder="Nama"
      />

      <br />

      <input
        type="email"
        placeholder="Email"
      />

      <br />

      <input
        type="password"
        placeholder="Password"
      />

      <br />

      <button>
        Register
      </button>
    </div>
  );
}