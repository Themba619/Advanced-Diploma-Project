import React, { useState, useEffect, JSX } from "react";
import { jwtDecode } from "jwt-decode";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import { toast } from "../components/ui/ForumUi/sonner";
import ForumQuestion from "../components/ForumQuestion";
import ReplyForm from "../components/ReplyForm";
import ReportModal from "../components/ReportModal";
import { profanityChecker } from "../../server/profanityChecker";
import "../styles/ForumStyles/layout.css";
import "../styles/ForumStyles/sidebar.css";
import "../styles/ForumStyles/header.css";
import "../styles/ForumStyles/posts.css";
import "../styles/ForumStyles/tags.css";
import "../styles/ForumStyles/topicInfo.css";
import ForumLikes from "../components/ForumLikes";

interface Reply {
  id: number;
  user: string;
  content: string;
  timeAgo: Date;
  replies: Reply[];
  likes: number;
  likedBy: string[]; // Array of user emails who liked this reply
}

interface Post {
  id: number;
  title: string;
  description: string;
  user: string;
  userEmail?: string; // Optional email field
  timeAgo: Date;
  tags: string[];
  chatCount: number;
  replies: Reply[];
}

const formatTimeAgo = (timestamp: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
};

const defaultPosts: Post[] = [
  {
    id: 1,
    title: "Where do I get a student card at UJ?",
    description:
      "I'm a first-year student at UJ and need to get my student card. Where do I go, and what documents do I need?",
    user: "NewbieUJ",
    timeAgo: new Date("2025-04-25T09:00:00Z"),
    tags: ["Academic Support", "General"],
    chatCount: 3,
    replies: [
      {
        id: 1.1,
        user: "UJHelper",
        content:
          "You can get your student card at the Student Enrolment Centre (SEC) on the Auckland Park Kingsway (APK) campus. Bring your ID/passport and proof of registration.",
        timeAgo: new Date("2025-04-25T10:30:00Z"),
        replies: [
          {
            id: 1.11,
            user: "NewbieUJ",
            content: "Thanks! Is there a specific time I should go?",
            timeAgo: new Date("2025-04-25T11:00:00Z"),
            replies: [],
            likes: 0,
            likedBy: [],
          },
        ],
        likes: 2,
        likedBy: ["user1@example.com", "user2@example.com"],
      },
    ],
  },
];

const topicInfo: Record<string, { title: string; content: JSX.Element }> = {
  "Academic Support": {
    title: "UJ Academic Support Resources",
    content: (
      <div>
        <p>
          Need help with your studies? UJ offers various academic support
          services:
        </p>
        <ul>
          <li>
            <strong>Writing Centre:</strong> Get assistance with essays and
            assignments at the APK Writing Centre.
          </li>
          <li>
            <strong>Tutoring:</strong> Contact your faculty for peer tutoring
            schedules.
          </li>
          <li>
            <strong>Blackboard:</strong> Access lecture notes and submit
            assignments on the UJ Blackboard platform.
          </li>
        </ul>
        <p>
          Visit the{" "}
          <a
            href="https://www.uj.ac.za/studyatUJ/Student-Services"
            target="_blank"
            rel="noopener noreferrer"
          >
            UJ Student Services
          </a>{" "}
          page for more details.
        </p>
      </div>
    ),
  },
  Housing: {
    title: "UJ Residence and Housing",
    content: (
      <div>
        <p>
          Looking for accommodation? UJ provides on-campus and accredited
          off-campus housing options:
        </p>
        <ul>
          <li>
            <strong>Residence Applications:</strong> Apply via the UJ Student
            Portal for residences on APK, Soweto, or Doornfontein campuses.
          </li>
          <li>
            <strong>Off-Campus Housing:</strong> Check the UJ website for
            accredited private accommodations.
          </li>
          <li>
            <strong>Contact:</strong> Email residences@uj.ac.za for queries.
          </li>
        </ul>
        <p>
          Learn more at the{" "}
          <a
            href="https://www.uj.ac.za/studyatUJ/Accommodation"
            target="_blank"
            rel="noopener noreferrer"
          >
            UJ Accommodation
          </a>{" "}
          page.
        </p>
      </div>
    ),
  },
  "Study Tips": {
    title: "Study Tips for UJ Students",
    content: (
      <div>
        <p>Boost your academic performance with these study tips:</p>
        <ul>
          <li>
            <strong>Library Access:</strong> Use the 24/7 library facilities
            during exams on the APK campus.
          </li>
          <li>
            <strong>Study Groups:</strong> Join or form study groups via UJ
            student societies.
          </li>
          <li>
            <strong>Time Management:</strong> Use the UJ academic calendar to
            plan your study schedule.
          </li>
        </ul>
        <p>
          Check out the{" "}
          <a
            href="https://www.uj.ac.za/studyatUJ/Student-Services"
            target="_blank"
            rel="noopener noreferrer"
          >
            UJ Study Support
          </a>{" "}
          page for more resources.
        </p>
      </div>
    ),
  },
  Social: {
    title: "Get Involved at UJ",
    content: (
      <div>
        <p>Join the vibrant UJ student community:</p>
        <ul>
          <li>
            <strong>Student Societies:</strong> Sign up for cultural, academic,
            or sports societies at the Student Centre.
          </li>
          <li>
            <strong>Events:</strong> Attend events like the UJ Arts Festival or
            sports tournaments.
          </li>
          <li>
            <strong>Connect:</strong> Follow UJ on social media for updates on
            campus events.
          </li>
        </ul>
        <p>
          Visit the{" "}
          <a
            href="https://www.uj.ac.za/studyatUJ/Student-Life"
            target="_blank"
            rel="noopener noreferrer"
          >
            UJ Student Life
          </a>{" "}
          page for more info.
        </p>
      </div>
    ),
  },
  General: {
    title: "General UJ Information",
    content: (
      <div>
        <p>Explore general resources for UJ students:</p>
        <ul>
          <li>
            <strong>Student Portal:</strong> Access the UJ Student Portal for
            registration, fees, and academic records.
          </li>
          <li>
            <strong>Campus Maps:</strong> Find your way around APK, Soweto, or
            Doornfontein with UJ’s online maps.
          </li>
          <li>
            <strong>Helpdesk:</strong> Contact the UJ Call Centre at 011 559
            4555 for assistance.
          </li>
        </ul>
        <p>
          Find more at the{" "}
          <a
            href="https://www.uj.ac.za/"
            target="_blank"
            rel="noopener noreferrer"
          >
            UJ Website
          </a>
          .
        </p>
      </div>
    ),
  },
  "All Topics": {
    title: "Welcome to the UJ Student Forum",
    content: (
      <div>
        <p>
          Welcome to the UJ Student Forum! Ask questions, share tips, and
          connect with fellow students across all UJ campuses.
        </p>
        <p>
          Select a topic from the sidebar to view relevant posts and resources,
          or browse all posts below.
        </p>
      </div>
    ),
  },
};

// Backend API functions
const fetchPosts = async (): Promise<Post[]> => {
  const res = await fetch("http://localhost:3001/posts");
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `Failed to fetch posts: ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Invalid data from server");
  return data.map((post: Post) => ({
    ...post,
    timeAgo: new Date(post.timeAgo),
    replies: post.replies.map((reply: Reply) => ({
      ...reply,
      timeAgo: new Date(reply.timeAgo),
      likes: reply.likes || 0,
      likedBy: reply.likedBy || [],
      replies: reply.replies.map((nestedReply: Reply) => ({
        ...nestedReply,
        timeAgo: new Date(nestedReply.timeAgo),
        likes: nestedReply.likes || 0,
        likedBy: nestedReply.likedBy || [],
      })),
    })),
  }));
};

const addPost = async (newPost: Post) => {
  const res = await fetch("http://localhost:3001/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newPost),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to add post");
  }
  return res.json();
};

const addReply = async ({
  postId,
  content,
  parentReplyId,
}: {
  postId: number;
  content: string;
  parentReplyId: number | null;
}) => {
  const res = await fetch(`http://localhost:3001/posts/${postId}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, parentReplyId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to add reply");
  }
  return res.json();
};

const toggleLike = async ({
  postId,
  replyId,
}: {
  postId: number;
  replyId: number;
}) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("User not authenticated");
  }

  const res = await fetch(
    `http://localhost:3001/posts/${postId}/replies/${replyId}/like`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update like status");
  }

  return res.json();
};

const submitReport = async (reportData: {
  postId: number;
  reason: string;
  description: string;
  reportedBy: string;
}) => {
  const res = await fetch("/api/email/report-post", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reportData),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to submit report");
  }

  return res.json();
};

const Forum: React.FC = () => {
  const topics = [
    "All Topics",
    "Academic Support",
    "Housing",
    "Study Tips",
    "Social",
    "General",
  ];
  const [selectedTopic, setSelectedTopic] = useState<string>("All Topics");
  const [showQuestionForm, setShowQuestionForm] = useState<boolean>(false);
  const [expandedReplies, setExpandedReplies] = useState<
    Record<string, boolean>
  >({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    postId: number | null;
    postTitle: string;
    postUser: string;
  }>({
    isOpen: false,
    postId: null,
    postTitle: "",
    postUser: "",
  });

  const [userEmail, setUserEmail] = useState<string>("");

  // Extract user email from JWT token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUserEmail(decoded.email || "");
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }
  }, []);

  const queryClient = useQueryClient();

  // Fetch posts
  const {
    data: posts = defaultPosts,
    isLoading,
    error,
  } = useQuery<Post[], { message: string }>({
    queryKey: ["posts"],
    queryFn: fetchPosts,
    retry: 1,
    staleTime: 1000 * 30, // 30 seconds - refresh more frequently for real-time updates
    refetchInterval: 1000 * 60, // Auto-refetch every minute to see other users' likes
  });

  // Add new post
  const addPostMutation = useMutation({
    mutationFn: addPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post added successfully");
      setShowQuestionForm(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add post");
    },
  });

  // Add new reply
  const addReplyMutation = useMutation({
    mutationFn: addReply,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Reply added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add reply");
    },
  });

  // Toggle like/unlike
  const likeMutation = useMutation({
    mutationFn: toggleLike,
    onSuccess: () => {
      // Invalidate and refetch posts to get updated like counts
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update like");
    },
  });

  // Submit report
  const reportMutation = useMutation({
    mutationFn: submitReport,
    onSuccess: () => {
      toast.success(
        "Report submitted successfully. Thank you for helping keep our community safe."
      );
      setReportModal({
        isOpen: false,
        postId: null,
        postTitle: "",
        postUser: "",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit report");
    },
  });

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
  };

  const handleSearch = () => {
    console.log("Search query:", searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAskQuestion = () => {
    setShowQuestionForm(true);
  };

  const handleCloseForm = () => {
    setShowQuestionForm(false);
  };

  const handleSubmitQuestion = async (newPost: {
    title: string;
    description: string;
    user?: string;
    tags: string[];
  }) => {
    const titleHasProfanity = await profanityChecker(newPost.title);
    const descriptionHasProfanity = await profanityChecker(newPost.description);
    const userHasProfanity = newPost.user
      ? await profanityChecker(newPost.user)
      : false;

    if (titleHasProfanity || descriptionHasProfanity || userHasProfanity) {
      toast.error(
        "Your post contains inappropriate language. Please revise and try again."
      );
      return;
    }

    const postToAdd: Post = {
      id: Date.now(), // temp ID, backend can override
      title: newPost.title,
      description: newPost.description,
      user: newPost.user || "Anonymous",
      userEmail: userEmail || undefined, // Include user email if available
      timeAgo: new Date(),
      tags: newPost.tags,
      chatCount: 0,
      replies: [],
    };

    addPostMutation.mutate(postToAdd);
  };

  const handleSubmitReply = async (
    postId: number,
    replyContent: string,
    parentReplyId: number | null = null
  ) => {
    if (await profanityChecker(replyContent)) {
      toast.error(
        "Your reply contains inappropriate language. Please revise and try again."
      );
      return;
    }
    addReplyMutation.mutate({ postId, content: replyContent, parentReplyId });
  };

  const toggleReplies = (id: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleReportPost = (
    postId: number,
    postTitle: string,
    postUser: string
  ) => {
    setReportModal({
      isOpen: true,
      postId,
      postTitle,
      postUser,
    });
  };

  const handleCloseReportModal = () => {
    setReportModal({
      isOpen: false,
      postId: null,
      postTitle: "",
      postUser: "",
    });
  };

  const handleSubmitReport = async (reportData: {
    postId: number;
    reason: string;
    description: string;
    reportedBy: string;
  }) => {
    // Find the post to get title and user info
    const post = posts.find((p) => p.id === reportData.postId);
    if (post) {
      const fullReportData = {
        ...reportData,
        postTitle: post.title,
        postUser: post.user,
      };
      reportMutation.mutate(fullReportData);
    }
  };

  const filteredPosts = React.useMemo(() => {
    return posts
      .filter((post) => {
        if (selectedTopic !== "All Topics") {
          return post.tags.includes(selectedTopic);
        }
        return true;
      })
      .filter((post) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          post.title.toLowerCase().includes(query) ||
          post.description.toLowerCase().includes(query)
        );
      });
  }, [posts, selectedTopic, searchQuery]);

  const renderReplies = (
    replies: Reply[],
    postId: number,
    level: number = 1
  ) => {
    // Sort replies by likes (most liked first)
    const sortedReplies = [...replies].sort(
      (a, b) => (b.likes || 0) - (a.likes || 0)
    );

    return sortedReplies.map((reply) => (
      <div key={reply.id} className={`reply level-${level}`}>
        <div className="reply-content">
          <span className="reply-user">{reply.user}</span>
          <p>{reply.content}</p>
          <span className="reply-time">{formatTimeAgo(reply.timeAgo)}</span>
          <button
            className="reply-button"
            onClick={() => toggleReplies(reply.id.toString())}
            aria-expanded={expandedReplies[reply.id] ? "true" : "false"}
            aria-controls={`replies-${reply.id}`}
          >
            {expandedReplies[reply.id]
              ? "Hide Replies"
              : `Show ${reply.replies.length} ${
                  reply.replies.length === 1 ? "Reply" : "Replies"
                }`}
          </button>
          <button
            className="reply-button"
            onClick={() => toggleReplies(`form-${reply.id}`)}
          >
            {expandedReplies[`form-${reply.id}`] ? "Cancel Reply" : "Reply"}
          </button>
          <ForumLikes
            postId={postId}
            replyId={reply.id}
            initialLikes={reply.likes || 0}
            initialLikedBy={reply.likedBy || []}
            onToggleLike={(postId, replyId) =>
              likeMutation.mutate({ postId, replyId })
            }
          />
        </div>
        {expandedReplies[`form-${reply.id}`] && (
          <ReplyForm
            onSubmit={(content: string) =>
              handleSubmitReply(postId, content, reply.id)
            }
          />
        )}
        {expandedReplies[reply.id] && reply.replies.length > 0 && (
          <div className="nested-replies">
            {renderReplies(reply.replies, postId, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (isLoading) return <div>Loading posts...</div>;
  if (error) return <div>Error loading posts: {error.message}</div>;

  return (
    <div className="forum-container">
      <div className="topics-sidebar">
        <h3>Filter by Topic</h3>
        <div className="topic-buttons">
          {topics.map((topic) => (
            <button
              key={topic}
              className={`topic-button ${
                selectedTopic === topic ? "active" : ""
              }`}
              onClick={() => handleTopicClick(topic)}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <div className="main-content">
        <div className="forum-header">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search questions..."
              className="search-input"
              value={searchQuery}
              onChange={handleSearchChange}
              aria-label="Search forum questions"
            />
            <button className="search-button" onClick={handleSearch}>
              Search
            </button>
          </div>
          <button
            className="ask-button"
            onClick={handleAskQuestion}
            disabled={addPostMutation.isPending}
          >
            {addPostMutation.isPending ? "Posting..." : "Ask Question"}
          </button>
        </div>

        <div className="topic-info">
          <h2>{topicInfo[selectedTopic].title}</h2>
          {topicInfo[selectedTopic].content}
        </div>

        {showQuestionForm && (
          <ForumQuestion
            topics={topics}
            onSubmit={handleSubmitQuestion}
            onClose={handleCloseForm}
          />
        )}

        <div className="posts-list">
          {filteredPosts.map((post) => (
            <div key={post.id} className="post-card">
              <h2 className="post-title">{post.title}</h2>
              <p className="post-description">{post.description}</p>
              <div className="post-meta">
                <div className="post-tags">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`tag ${tag.toLowerCase().replace(" ", "-")}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="post-info">
                  <span className="post-user">
                    Asked by {post.user} {formatTimeAgo(post.timeAgo)}
                  </span>
                  <span className="chat-count">
                    {post.chatCount === 0
                      ? "No chats"
                      : `${post.chatCount} ${
                          post.chatCount === 1 ? "chat" : "chats"
                        }`}
                  </span>
                </div>
              </div>
              <div className="replies-section">
                <button
                  className="reply-button"
                  onClick={() => toggleReplies(`post-${post.id}`)}
                  aria-expanded={
                    expandedReplies[`post-${post.id}`] ? "true" : "false"
                  }
                  aria-controls={`replies-post-${post.id}`}
                >
                  {expandedReplies[`post-${post.id}`]
                    ? "Hide Replies"
                    : `Show ${post.replies.length} ${
                        post.replies.length === 1 ? "Reply" : "Replies"
                      }`}
                </button>
                <button
                  className="reply-button"
                  onClick={() => toggleReplies(`form-post-${post.id}`)}
                >
                  {expandedReplies[`form-post-${post.id}`]
                    ? "Cancel Reply"
                    : "Reply"}
                </button>
                <button
                  className="report-button"
                  onClick={() =>
                    handleReportPost(post.id, post.title, post.user)
                  }
                  title="Report this post"
                >
                  ⚠️ Report
                </button>
                {expandedReplies[`form-post-${post.id}`] && (
                  <ReplyForm
                    onSubmit={(content: string) =>
                      handleSubmitReply(post.id, content)
                    }
                  />
                )}
                {expandedReplies[`post-${post.id}`] &&
                  post.replies.length > 0 && (
                    <div className="replies-list">
                      {renderReplies(post.replies, post.id)}
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={handleCloseReportModal}
        onSubmit={handleSubmitReport}
        postId={reportModal.postId}
        postTitle={reportModal.postTitle}
        postUser={reportModal.postUser}
      />
    </div>
  );
};

export default Forum;
