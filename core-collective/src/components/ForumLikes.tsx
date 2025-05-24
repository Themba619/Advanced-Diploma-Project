// import React, {useState} from 'react'
// import { AiFillLike, AiFillDislike } from 'react-icons/ai';

// const ForumLikes = () => {

//     const[liked, setLiked] = useState(false);
//     const[likesCount, setLikesCount] = useState(0)

//     const handleLikeClick = () => {
//     setLiked(!liked);
//     setLikesCount(likesCount + 1)
//   };

//   const handleDisLikeClick = () => {
//     setLiked(!liked);
//     setLikesCount(likesCount - 1)
//   };

//   if(liked){
//     return (
//         <div>
//             <AiFillDislike
//         color="red"
//         size="50"
//         onClick={handleDisLikeClick}/>
//         <p>{likesCount}</p>
//         </div>
//     )
//   }else{
//     return (
//     <div>
//         <AiFillLike
//             color="blue"
//             size="50"
//             likesCount
//             onClick={handleLikeClick}/>
//             <p>{likesCount}</p>
//     </div>
//   )
//   }
// }

// export default ForumLikes;

// Version 2
// import React, { useState, useEffect } from 'react';
// import { AiFillLike, AiFillDislike } from 'react-icons/ai';
// import '../styles/ForumStyles/ForumLikes.css'; // Import the CSS file

// const ForumLikes = () => {
//   const [liked, setLiked] = useState(false);
//   const [likesCount, setLikesCount] = useState(0);

//   const handleLikeClick = () => {
//     setLiked(true);
//     setLikesCount(prev => prev + 1);
//   };

//   const handleDislikeClick = () => {
//     setLiked(false);
//     setLikesCount(prev => (prev > 0 ? prev - 1 : 0));
//   };

//   useEffect(() => {
//     console.log(liked);
//   }, [liked]);

//   return (
//     <div className="forum-likes-container">
//       {liked ? (
//         <div>
//             <AiFillDislike
//           className="icon dislike"
//           size={26}
//           onClick={handleDislikeClick}
//         />
//         <p>Like</p>
//         </div>

//       ) : (
//         <div>
//             <AiFillLike
//           className="icon like"
//           size={26}
//           onClick={handleLikeClick}
//         />
//         <p>Dislike</p>
//         </div>
//       )}
//       <p className="likes-count">{likesCount}</p>
//     </div>
//   );
// };

// export default ForumLikes;

// version 3
import React, { useState, useEffect, useRef } from "react";
import { AiFillLike, AiFillDislike } from "react-icons/ai";
import "../styles/ForumStyles/ForumLikes.css";

const ForumLikes = () => {
  // State
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Ref
  const mounted = useRef<boolean>(false);

  let likesArr = {};

  // Changed the value of liked
  useEffect(() => {
    likesArr = { newValue: liked };
  }, [liked]);

  // Convert the array to a blob for navigation.sendBeacon
  useEffect(() => {
    // Convert the JSON object to a string
    const jsonString = JSON.stringify(likesArr);

    // Create a Blob from that string
    const blob = new Blob([jsonString], { type: "application/json" });
  }, [liked]); // Based on the change of the liked bool

  // Send this when the browser unloads the component
  // sendBeacon(url, likesArr)

  useEffect(() => {
    mounted.current = true;
    console.log(`Mounted status: ${mounted}`);
    return () => {
      mounted.current = false;
      console.log(`Mounted status: ${mounted}`);
    };
  }, []);

  const handleLikeClick = () => {
    setLiked(true);
    setLikesCount((prev) => prev + 1);
  };

  const handleDislikeClick = () => {
    setLiked(false);
    setLikesCount((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const getBlobData = async (blob: Blob) => {
    const text = await new Response(blob).text();
    return text;
  };

  return (
    <div className="forum-likes-container">
      {liked ? (
        <div onClick={handleDislikeClick}>
          <AiFillDislike className="icon dislike" size={26} />
          <p style={{ fontWeight: "bold", fontSize: "10px" }}>DisLike</p>
        </div>
      ) : (
        <div onClick={handleLikeClick}>
          <AiFillLike className="icon like" size={26} />
          <p style={{ fontWeight: "bold", fontSize: "10px" }}>Like</p>
        </div>
      )}
      <p className="likes-count">{likesCount}</p>
    </div>
  );
};

export default ForumLikes;
