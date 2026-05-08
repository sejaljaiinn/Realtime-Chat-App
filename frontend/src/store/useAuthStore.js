
import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  // CHECK AUTH
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      const current = get().authUser;

      if (!current) {
        set({ authUser: res.data });
      }

      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  // LOGIN
  // login: async (data) => {
  //   set({ isLoggingIn: true });

  //   try {
  //     const res = await axiosInstance.post("/auth/login", data);

  //     get().disconnectSocket();

  //     set({
  //       authUser: res.data,
  //       socket: null,
  //       onlineUsers: [],
  //     });

  //     toast.success("Logged in successfully");

  //     get().connectSocket();
  //   } catch (error) {
  //     toast.error(error.response?.data?.message || "Login failed");
  //   } finally {
  //     set({ isLoggingIn: false });
  //   }
  // },
  login: async (data) => {
  const res = await axiosInstance.post("/auth/login", data);

  // 🔥 EACH TAB HAS ITS OWN TOKEN
  sessionStorage.setItem("token", res.data.token);

  set({ authUser: res.data.user });

  get().connectSocket();
},

  // SIGNUP
  // signup: async (data) => {
  //   set({ isSigningUp: true });

  //   try {
  //     const res = await axiosInstance.post("/auth/signup", data);

  //     set({ authUser: res.data });

  //     toast.success("Account created successfully");

  //     get().connectSocket();
  //   } catch (error) {
  //     toast.error(error.response?.data?.message || "Signup failed");
  //   } finally {
  //     set({ isSigningUp: false });
  //   }
  // },
signup: async (data) => {
  const res = await axiosInstance.post("/auth/signup", data);

  sessionStorage.setItem("token", res.data.token);

  set({ authUser: res.data.user });

  get().connectSocket();
},
  // LOGOUT
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");

      get().disconnectSocket();

      set({
        authUser: null,
        socket: null,
        onlineUsers: [],
      });

      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  },

  // UPDATE PROFILE
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });

    try {
      const res = await axiosInstance.put("/auth/update-profile", data);

      set({ authUser: res.data });

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // SOCKET CONNECT

// connectSocket: () => {
//   const { authUser } = get();
//   if (!authUser) return;

//   const socket = io("http://localhost:5001", {
//     transports: ["websocket"],
//   });

//   set({ socket });

//   socket.on("connect", () => {
//     socket.emit("register", authUser._id);
//   });

//   // 🔥 REMOVE OLD LISTENERS BEFORE ADDING NEW
//   socket.off("newMessage");

//   socket.on("newMessage", (message) => {
//     console.log("new message:", message);

//     const messages = get().messages;

//     set({ messages: [...messages, message] });
//   });

//   socket.on("getOnlineUsers", (users) => {
//     set({ onlineUsers: users });
//   });
// },
connectSocket: () => {
  const { authUser } = get();
  if (!authUser) return;

  const socket = io("http://localhost:5001", {
    transports: ["websocket"],
  });

  set({ socket });

  socket.on("connect", () => {
    socket.emit("register", authUser._id);
  });

  socket.off("newMessage");

  socket.on("newMessage", (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  });

  socket.on("getOnlineUsers", (users) => {
    set({ onlineUsers: users });
  });
},
  // SOCKET DISCONNECT
  disconnectSocket: () => {
    const socket = get().socket;

    if (socket?.connected) {
      socket.disconnect();
    }

    set({
      socket: null,
      onlineUsers: [],
    });
  },
}));