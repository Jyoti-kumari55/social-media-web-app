
import axios from "axios";
import {
  toggleFollowSuccess,
  updateUserProfileSuccess,
} from "../features/userSlice";

// This function handles the toggle follow/unfollow logic
export const toggleFollowHandler = async (
  followUserId,
  user,
  token,
  dispatch
) => {
  try {
    const response = await axios.put(
       `${process.env.REACT_APP_SOCIAL_BACKEND_API}/api/users/toggleFollow/${followUserId}`,
      { userId: user?._id },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );
    console.log("follow user: ", response.data); // log success response
    window.location.reload();

    // Dispatch the success action to update the local state
    dispatch(toggleFollowSuccess(followUserId));
  } catch (error) {
    console.log(error.message);
    throw new Error("Failed to toggle follow status.");
  }
};

export const updateUserHandler = async (userId, userData, token, dispatch) => {
  try {
    const response = await axios.put(
       `${process.env.REACT_APP_SOCIAL_BACKEND_API}/api/users/${userId}`,
      userData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    console.log("User Updated Successfully", response.data);
    dispatch(updateUserProfileSuccess(response.data.user));

    window.location.reload();
  } catch (error) {
    console.log("Error updating user:", error.message);
    throw error;
  }
};





