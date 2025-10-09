import React, { useState } from "react";
import "../styles/ForumStyles/reportModal.css";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number | null;
  postTitle: string;
  postUser: string;
  onSubmit: (reportData: {
    postId: number;
    reason: string;
    description: string;
    reportedBy: string;
  }) => void;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  postId,
  postTitle,
  postUser,
  onSubmit,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen || postId === null) return null;

  const reportReasons = [
    "Inappropriate Language/Profanity",
    "Racism/Discrimination",
    "Harassment/Bullying",
    "Spam/Irrelevant Content",
    "Misinformation",
    "Violence/Threats",
    "Sexual Content",
    "Hate Speech",
    "Copyright Violation",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReason) {
      alert("Please select a reason for reporting this post.");
      return;
    }

    if (selectedReason === "Other" && !description.trim()) {
      alert('Please provide a description when selecting "Other".');
      return;
    }

    setLoading(true);

    try {
      // Get user info from localStorage (assuming you have user data stored)
      const token = localStorage.getItem("token");
      let reportedBy = "Anonymous";

      if (token) {
        try {
          // You might want to decode the JWT token to get user info
          // For now, I'll use a placeholder
          reportedBy = "Authenticated User";
        } catch (error) {
          console.error("Error getting user info:", error);
        }
      }

      if (postId !== null) {
        await onSubmit({
          postId,
          reason: selectedReason,
          description:
            selectedReason === "Other"
              ? description
              : `${selectedReason}${description ? ` - ${description}` : ""}`,
          reportedBy,
        });
      }

      // Reset form
      setSelectedReason("");
      setDescription("");
      onClose();
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedReason("");
      setDescription("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="report-modal-overlay" onClick={handleClose}>
      <div
        className="report-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="report-modal-header">
          <h2>Report Post</h2>
          <button
            className="report-modal-close"
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="report-modal-body">
          <div className="reported-post-info">
            <h3>Post being reported:</h3>
            <p>
              <strong>Title:</strong> {postTitle}
            </p>
            <p>
              <strong>Author:</strong> {postUser}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="report-reason-section">
              <h3>Why are you reporting this post?</h3>
              <div className="reason-options">
                {reportReasons.map((reason) => (
                  <label key={reason} className="reason-option">
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      disabled={loading}
                    />
                    <span className="reason-text">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {(selectedReason === "Other" || selectedReason) && (
              <div className="description-section">
                <label htmlFor="description">
                  {selectedReason === "Other"
                    ? "Please describe the issue:"
                    : "Additional details (optional):"}
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    selectedReason === "Other"
                      ? "Please provide details about the issue..."
                      : "Any additional information you'd like to provide..."
                  }
                  rows={4}
                  required={selectedReason === "Other"}
                  disabled={loading}
                />
              </div>
            )}

            <div className="report-modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-report-button"
                disabled={loading || !selectedReason}
              >
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
