import React, { useState, useEffect } from "react";
import { AiFillLike, AiFillDislike } from "react-icons/ai";
import { jwtDecode } from "jwt-decode";
import "../styles/ForumStyles/ForumLikes.css";

interface ForumLikesProps {
  postId: number;
  replyId: number;
  initialLikes: number;
  initialLikedBy: string[];
  onLikesChange?: (newLikes: number) => void;
  onToggleLike?: (postId: number, replyId: number) => void;
}

const ForumLikes: React.FC<ForumLikesProps> = ({ 
  postId, 
  replyId, 
  initialLikes, 
  initialLikedBy,
  onLikesChange,
  onToggleLike 
}) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Get current user email from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token) as any;
        setUserEmail(decoded.email || "");
      } catch (err) {
        console.error("Failed to decode token:", err);
      }
    }
  }, []);

  // Check if current user has liked this reply
  useEffect(() => {
    if (userEmail) {
      setLiked(initialLikedBy.includes(userEmail));
    }
  }, [userEmail, initialLikedBy]);

  // Update likes count when prop changes
  useEffect(() => {
    setLikesCount(initialLikes);
  }, [initialLikes]);

  const handleLikeToggle = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("User not authenticated");
      return;
    }

    if (isUpdating) return; // Prevent double clicks

    setIsUpdating(true);

    // Optimistic update - update UI immediately
    const newLiked = !liked;
    const newLikesCount = newLiked ? likesCount + 1 : likesCount - 1;
    
    setLiked(newLiked);
    setLikesCount(newLikesCount);
    
    // Notify parent component of the optimistic change
    if (onLikesChange) {
      onLikesChange(newLikesCount);
    }

    try {
      // Use the mutation callback if provided, otherwise fallback to direct fetch
      if (onToggleLike) {
        onToggleLike(postId, replyId);
      } else {
        // Fallback for direct API call
        const response = await fetch(`http://localhost:3001/posts/${postId}/replies/${replyId}/like`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("Failed to update like status");
        }
      }
    } catch (err) {
      console.error("Error updating like:", err);
      
      // Revert optimistic update on error
      setLiked(!newLiked);
      setLikesCount(likesCount);
      
      if (onLikesChange) {
        onLikesChange(likesCount);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="forum-likes-container">
      <div 
        onClick={handleLikeToggle} 
        style={{ 
          cursor: isUpdating ? 'wait' : 'pointer',
          opacity: isUpdating ? 0.7 : 1 
        }}
      >
        <AiFillLike 
          className={`icon ${liked ? 'liked' : 'like'}`} 
          size={26} 
          style={{ color: liked ? '#007bff' : '#666' }}
        />
        <p style={{ 
          fontWeight: "bold", 
          fontSize: "10px",
          color: liked ? '#007bff' : '#666'
        }}>
          {isUpdating ? "..." : (liked ? "Liked" : "Like")}
        </p>
      </div>
      <p className="likes-count">{likesCount}</p>
    </div>
  );
};

export default ForumLikes;
