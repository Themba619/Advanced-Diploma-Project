// export const profanityChecker = async (message) => {
//   const response = await fetch('https://vector.profanity.dev', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ message }),
//   });

//   const data = await response.json();
//   return data.isProfanity
// };

exports.checkProfanity = async (req, res) => {
  const { message } = req.body;

  try {
    const response = await fetch('https://vector.profanity.dev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error('Error checking profanity:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
