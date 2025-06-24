import React, { useEffect, useState } from 'react';
import SendBird from 'sendbird';

const APP_ID = import.meta.env.VITE_SENDBIRD_APP_ID;

const DirectMessage = ({ userId, nickname, targetUserId }) => {
  const [sb, setSb] = useState(null);
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const sbInstance = new SendBird({ appId: APP_ID });
    let isMounted = true;

    sbInstance.connect(userId, function(user, error) {
      if (!isMounted) return;
      if (error) {
        console.error('Sendbird connect error:', error);
        return;
      }
      sbInstance.updateCurrentUserInfo(nickname, null, () => {});
      sbInstance.GroupChannel.createChannelWithUserIds(
        [userId, targetUserId],
        true,
        (groupChannel, err) => {
          if (!isMounted) return;
          if (err) {
            console.error('Channel error:', err);
            return;
          }
          setChannel(groupChannel);
          groupChannel.getMessagesByTimestamp(
            new Date().getTime(),
            true,
            50,
            {},
            (msgs, err) => {
              if (!isMounted) return;
              if (!err) setMessages(msgs);
            }
          );
        }
      );
      setSb(sbInstance);
    });

    return () => {
      isMounted = false;
      sbInstance.disconnect();
    };
  }, [userId, nickname, targetUserId]);

  const sendMessage = () => {
    if (channel && input.trim()) {
      channel.sendUserMessage(input, (msg, err) => {
        if (!err) setMessages(prev => [...prev, msg]);
        setInput('');
      });
    }
  };

  return (
    <div>
      <div>
        {messages.map(msg => (
          <div key={msg.messageId}>{msg.message}</div>
        ))}
      </div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default DirectMessage;