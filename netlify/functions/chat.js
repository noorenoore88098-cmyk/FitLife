exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { message, profile } = JSON.parse(event.body || "{}");

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "اكتب رسالتك أولاً" })
      };
    }

    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-5.5",
          messages: [
            {
              role: "system",
              content: "أنت مدرب رياضي وتغذية محترف. أجب باللغة العربية وبأسلوب بسيط ومختصر. قدم نصائح آمنة ومناسبة للمعلومات الشخصية المتاحة."
            },
            {
              role: "user",
              content: `بيانات المستخدم: ${JSON.stringify(profile || {})}\nالسؤال: ${message}`
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "OpenAI API error");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reply: data.choices[0].message.content
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "حدث خطأ في المدرب الذكي" })
    };
  }
};