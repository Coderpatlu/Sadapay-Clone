import React, { useState } from "react";
import { useGetUsersQuery } from "../../Redux/Api/AuthApi";
import "../../Styles/User/Users.css";

const Users = () => {
  const [search, setSearch] = useState("");
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetUsersQuery();

  const query = search.trim().toLowerCase();
  const users = (data?.users || []).filter(
    (user) =>
      user.fullName?.toLowerCase().includes(query) ||
      user.phone?.includes(query),
  );

  return (
    <main className="users-page">
      <header className="users-header">
        <p className="users-eyebrow">SADAPAY DIRECTORY</p>
        <h1>Users</h1>
        <p>Find a user by name or phone number.</p>
      </header>

      <label className="users-search">
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search users"
          aria-label="Search users by name or phone number"
        />
      </label>

      {isLoading || isFetching ? (
        <p className="users-message">Loading users...</p>
      ) : isError ? (
        <section className="users-message users-error" role="alert">
          <p>
            {error?.data?.message ||
              error?.error ||
              "Unable to load the user directory."}
          </p>
          <button type="button" onClick={() => refetch()}>
            Try again
          </button>
        </section>
      ) : users.length === 0 ? (
        <p className="users-message">
          {query ? "No users match your search." : "No users found."}
        </p>
      ) : (
        <ul className="users-list">
          {users.map((user) => (
            <li className="users-card" key={user._id}>
              <span className="users-avatar" aria-hidden="true">
                {user.fullName?.trim().charAt(0).toUpperCase() || "U"}
              </span>
              <span className="users-card-copy">
                <strong>{user.fullName}</strong>
                <span>{user.phone}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};

export default Users;
