"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { signOut } from "next-auth/react";

interface IUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  major?: string;
}

const MAJORS = [
  "Computer Science",
  "Physics",
  "Chemistry",
  "Biology",
  "Mathematics",
];

export default function AllUsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState("");
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<IUser[]>([]);
  const [currentView, setCurrentView] = useState<"all" | "pending">("all"); // 'all' or 'pending'
  const [pendingUserRoles, setPendingUserRoles] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/login");
    }
    // Check if user is admin
    if (status === "authenticated" && session?.user?.role !== "admin") {
      redirect("/quiz");
    }
  }, [status, session]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (session?.user?.role !== "admin") {
        setLoading(false);
        setError("Unauthorized");
        return;
      }
      try {
        setLoading(true);
        // Fetch All Users
        const allUsersRes = await fetch("/api/admin/all-users");
        if (!allUsersRes.ok) {
          throw new Error(`Error fetching all users: ${allUsersRes.status}`);
        }
        const allUsersData = await allUsersRes.json();
        setAllUsers(allUsersData);

        // Fetch Pending Users
        const pendingUsersRes = await fetch("/api/admin/pending-users");
        if (!pendingUsersRes.ok) {
          throw new Error(
            `Error fetching pending users: ${pendingUsersRes.status}`
          );
        }
        const pendingUsersData = await pendingUsersRes.json();
        setPendingUsers(pendingUsersData);

        // Initialize users state with all users
        setUsers(allUsersData);

        setError(null);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError(err instanceof Error ? err.message : "Failed to load users.");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchUsers();
    }
  }, [status, session]);

  const handleRoleChange = async (
    userId: string,
    currentRole: string,
    targetRole: string
  ) => {
    if (currentRole === targetRole) {
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: userId, targetRole }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error: ${res.status}`);
      }

      const data = await res.json();
      setMessage(data.message || "User role updated successfully.");
      setError(null);

      // Update the user in the appropriate state based on current view
      const updatedUser = data.user; // Assuming the API returns the updated user

      setAllUsers((prevAllUsers) => [
        ...prevAllUsers.filter((user) => user._id !== userId),
        updatedUser,
      ]);
      setPendingUsers((prevPendingUsers) => [
        ...prevPendingUsers.filter((user) => user._id !== userId),
        updatedUser,
      ]);
      setUsers((prevUsers) => [
        ...prevUsers.filter((user) => user._id !== userId),
        updatedUser,
      ]);
    } catch (err) {
      console.error("Failed to update role:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update user role."
      );
      // Refetch users after error
      const res = await fetch("/api/admin/all-users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    }
  };

  const handleNameEditClick = (user: IUser) => {
    //shows the input
    setEditingUserId(user._id); // Ilgili kullanicinin id'sini tutar
    setEditingUserName(user.name); // Kullanıcının ismini input'un içine yazmak için state'e başlangıç değeri atar.
  };

  const handleNameSaveClick = async (userId: string) => {
    if (editingUserName.trim() === "") {
      //isim bos ise hata ver
      setError("Name cannot be empty.");
      return;
    }
    const originalUser = users.find((user) => user._id === userId); //degisiklik yapilmadiysa islemi durdur
    if (originalUser && originalUser.name === editingUserName) {
      setEditingUserId(null);
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        //api'ye isim degisikligi gonderilir
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: userId, name: editingUserName }),
      });

      if (!res.ok) {
        //api'den hata alinirsa hata ver
        const errorData = await res.json();
        throw new Error(errorData.error || `Error: ${res.status}`);
      }

      const data = await res.json(); //api'den gelen veri
      setMessage(data.message || "User name updated successfully.");
      setError(null);

      const updatedUser = data.user; // Assuming the API returns the updated user

      // Update the user in all state variables
      setAllUsers((prevAllUsers) => [
        ...prevAllUsers.filter((user) => user._id !== userId),
        updatedUser,
      ]);
      setPendingUsers((prevPendingUsers) => [
        ...prevPendingUsers.filter((user) => user._id !== userId),
        updatedUser,
      ]);
      setUsers((prevUsers) => [
        ...prevUsers.filter((user) => user._id !== userId),
        updatedUser,
      ]);

      setEditingUserId(null);
      setEditingUserName("");
    } catch (err) {
      console.error("Failed to update name:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update user name."
      );
    }
  };

  const handleNameCancelClick = () => {
    setEditingUserId(null);
    setEditingUserName("");
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (confirm(`Are you sure you want to delete user ${userEmail}?`)) {
      try {
        const res = await fetch(`/api/admin/users?id=${userId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Error: ${res.status}`);
        }

        const data = await res.json();
        setMessage(data.message || "User deleted successfully.");
        setError(null);

        // Remove the deleted user from all state variables
        setAllUsers((prevAllUsers) =>
          prevAllUsers.filter((user) => user._id !== userId)
        );
        setPendingUsers((prevPendingUsers) =>
          prevPendingUsers.filter((user) => user._id !== userId)
        );
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user._id !== userId)
        );
      } catch (err) {
        console.error("Failed to delete user:", err);
        setError(err instanceof Error ? err.message : "Failed to delete user.");
      }
    }
  };

  // New function to handle accepting a pending user
  const handleAcceptUser = async (userId: string) => {
    const selectedRole = pendingUserRoles[userId] || "student";
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: userId, targetRole: selectedRole }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || `Error accepting user: ${res.status}`
        );
      }

      setMessage("User accepted successfully.");
      setError(null);

      // Remove from pendingUsers state and add to allUsers state if needed, then update displayed users
      setPendingUsers((prevPendingUsers) =>
        prevPendingUsers.filter((user) => user._id !== userId)
      );
      // Update h all users (add the accepted user to allUsers state)
      const allUsersRes = await fetch("/api/admin/all-users"); //first fetch it
      if (allUsersRes.ok) {
        const allUsersData = await allUsersRes.json();
        setAllUsers(allUsersData);
        // Update displayed users if currently viewing all users
        if (currentView === "all") {
          setUsers(allUsersData);
        } //if current view is all, update the displayed users
      }

      // Update displayed users if currently viewing pending users
      if (currentView === "pending") {
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user._id !== userId)
        );
      }
    } catch (err) {
      console.error("Failed to accept user:", err);
      setError(err instanceof Error ? err.message : "Failed to accept user.");
    }
  };

  if (status === "loading" || loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (error === "Unauthorized") {
    return (
      <div className="container mx-auto px-4 py-8 text-red-600">
        You are not authorized to view this page.
      </div>
    );
  }

  if (error && error !== "Unauthorized") {
    return (
      <div className="container mx-auto px-4 py-8 text-red-600">
        Error: {error}
      </div>
    );
  }

  if (session?.user?.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-8 text-red-600">
        You are not authorized to view this page.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-white">
      {/* Container */}
      <div className="max-w-7xl mx-auto">
        {/* Icerik ortalayici */}
        <div className="flex justify-between items-center mb-8">
          {/* Flexbox */}
          <div>
            {/* Baslik (Flexbox first item) */}
            <h1 className="text-3xl font-bold text-gray-800">
              User Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage and monitor all system users
            </p>
          </div>
          <div className="flex space-x-4">
            {/* Butonlar (Flexbox second item) */}
            <button
              onClick={() => {
                setCurrentView("all");
                setUsers(allUsers);
              }}
              className={`px-4 py-2 rounded-md ${
                currentView === "all"
                  ? "bg-blue-600 text-white"
                  : "border border-blue-600 text-blue-600"
              } hover:bg-blue-700 hover:text-white`}
            >
              All Users
            </button>
            <button
              onClick={() => {
                setCurrentView("pending");
                setUsers(pendingUsers);
              }}
              className={`px-4 py-2 rounded-md ${
                currentView === "pending"
                  ? "bg-blue-600 text-white"
                  : "border border-blue-600 text-blue-600"
              } hover:bg-blue-700 hover:text-white`}
            >
              Pending Users ({pendingUsers.length})
            </button>
            {/* Logout Button */}
            <button
              onClick={() => signOut()}
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Logout
            </button>
          </div>
        </div>
        {/* ------------------------------------------------------------------------------------------------ */}
        {/* Ana kutucuk */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200">
          {/* Birinci İç Div */}
          <div className="p-6 border-b border-slate-200">
            {/* Bu div, içindeki mavi bilgilendirme kutusunu kapsar */}

            {/* İkinci İç Div (Mavi Bilgilendirme Kutusu) */}
            <div className="bg-blue-100 border-l-4 border-blue-400 p-4 rounded">
              {/* Bu div, asıl bilgilendirme mesajını (p etiketi) içerir. */}
              <p className="text-blue-800">
                As an admin, you can manage users and their roles. Use the
                options below to edit user details, change roles, or remove
                users.
              </p>
            </div>
          </div>
          {message && (
            <div className="p-4 bg-emerald-100 border-b border-emerald-200">
              {/* Bu div, onay ikonu ve mesaj metnini içeren flex kutusunu kapsar. */}
              <div className="flex">
                {/* Flexbox */}
                <div className="flex-shrink-0">
                  {/* svg (flexbox first item) */}
                  <svg
                    className="h-5 w-5 text-emerald-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  {/* Flexbox second item (message) */}
                  <p className="text-sm font-medium text-emerald-800">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          )}
          {error && error !== "Unauthorized" && (
            <div className="p-4 bg-rose-100 border-b border-rose-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-rose-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-rose-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          {users.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider"
                    >
                      Current Role
                    </th>
                    {currentView === "all" && (
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider"
                      >
                        Current Major
                      </th>
                    )}
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider"
                    >
                      New Role
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUserId === user._id ? ( // Eğer mevcut satırdaki kullanıcı düzenleniyorsa...
                          <input // ...bir metin giriş alanı göster
                            type="text" //tek satirlik veri giris alani
                            value={editingUserName}
                            onChange={(e) => setEditingUserName(e.target.value)}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-400 focus:ring-blue-400 sm:text-sm text-gray-700"
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-800">
                            {user.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : user.role === "teacher"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      {currentView === "all" && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.role === "teacher" ? (
                            <select
                              value={user.major || ""}
                              onChange={async (e) => {
                                const newMajor = e.target.value;
                                const res = await fetch("/api/admin/users", {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    id: user._id,
                                    major: newMajor,
                                  }),
                                });
                                if (res.ok) {
                                  setUsers((prevUsers) =>
                                    prevUsers.map((u) =>
                                      u._id === user._id
                                        ? { ...u, major: newMajor }
                                        : u
                                    )
                                  );
                                  setAllUsers((prevAllUsers) =>
                                    prevAllUsers.map((u) =>
                                      u._id === user._id
                                        ? { ...u, major: newMajor }
                                        : u
                                    )
                                  );
                                } else {
                                  const data = await res.json();
                                  alert(data.error || "Failed to update major");
                                }
                              }}
                              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-400 focus:ring-blue-400 sm:text-sm text-gray-700"
                            >
                              <option value="">Select Major</option>
                              {MAJORS.map((major) => (
                                <option key={major} value={major}>
                                  {major}
                                </option>
                              ))}
                            </select>
                          ) : (
                            user.major || "N/A"
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => {
                            const targetRole = e.target.value;
                            setUsers(
                              users.map((u) =>
                                u._id === user._id
                                  ? { ...u, role: targetRole }
                                  : u
                              )
                            );
                            if (currentView === "pending") {
                              setPendingUserRoles((prev) => ({
                                ...prev,
                                [user._id]: targetRole,
                              }));
                            }
                            // Immediately trigger backend update for role change
                            if (user.role !== targetRole) {
                              handleRoleChange(user._id, user.role, targetRole);
                            }
                          }}
                          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-400 focus:ring-blue-400 sm:text-sm text-gray-700"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          {user.role === "admin" && (
                            <option value="admin">Admin</option>
                          )}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingUserId === user._id ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleNameSaveClick(user._id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleNameCancelClick}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            {/* Actions for Pending Users */}
                            {currentView === "pending" &&
                              user.role !== "admin" && (
                                <>
                                  <button
                                    onClick={() => handleAcceptUser(user._id)}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteUser(user._id, user.email)
                                    } // Reject is same as delete
                                    className="text-rose-600 hover:text-rose-900"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                            {/* Actions for All Users */}
                            {currentView === "all" && user.role !== "admin" && (
                              <>
                                <button
                                  onClick={() => handleNameEditClick(user)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Edit Name
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteUser(user._id, user.email)
                                  }
                                  className="text-rose-600 hover:text-rose-900"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
