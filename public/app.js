const questions = [

  {

    factor: "dpa",

    text: "Our business regularly accepts digital payments from customers."

  },

  {

    factor: "dpa",

    text: "Digital payment methods are part of our normal daily operations."

  },

  {

    factor: "dpa",

    text: "We offer digital payment methods that suit our customers."

  },

  {

    factor: "ia",

    text: "Our internet connection is reliable enough for digital payments."

  },

  {

    factor: "ia",

    text: "We have suitable devices or terminals to process digital payments."

  },

  {

    factor: "ia",

    text: "Technical assistance is available when payment problems occur."

  },

  {

    factor: "dfl",

    text: "We can verify digital transactions correctly."

  },

  {

    factor: "dfl",

    text: "We understand digital-payment security and possible fraud risks."

  },

  {

    factor: "dfl",

    text: "We know how to respond to failed or delayed transactions."

  },

  {

    factor: "pu",

    text: "Digital payments make transactions faster and more convenient."

  },

  {

    factor: "pu",

    text: "Digital payments improve our transaction records and financial control."

  },

  {

    factor: "pu",

    text: "Digital payments contribute positively to our business activities."

  }

];



const factorNames = {

  dpa: "Digital Payment Adoption",

  ia: "Infrastructure Availability",

  dfl: "Digital Financial Literacy",

  pu: "Perceived Usefulness"

};



const answerLabels = [

  "Strongly Disagree",

  "Disagree",

  "Neutral",

  "Agree",

  "Strongly Agree"

];



let currentQuestion = 0;

let answers = new Array(questions.length).fill(null);



function getElement(id) {

  return document.getElementById(id);

}



function showSection(sectionId) {

  document.querySelectorAll(".page-section").forEach(section => {

    section.classList.remove("active");

  });



  const section = getElement(sectionId);



  if (section) {

    section.classList.add("active");

  }



  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });

}



function displayQuestion() {

  const question = questions[currentQuestion];



  getElement("factorName").textContent =

    factorNames[question.factor];



  getElement("questionProgress").textContent =

    `Question ${currentQuestion + 1} of ${questions.length}`;



  getElement("progressBar").style.width =

    `${((currentQuestion + 1) / questions.length) * 100}%`;



  getElement("questionNumber").textContent =

    `QUESTION ${String(currentQuestion + 1).padStart(2, "0")}`;



  getElement("questionText").textContent =

    question.text;



  displayAnswerOptions();



  getElement("backButton").style.visibility =

    currentQuestion === 0 ? "hidden" : "visible";



  getElement("nextButton").disabled =

    answers[currentQuestion] === null;



  getElement("nextButton").textContent =

    currentQuestion === questions.length - 1

      ? "View Results"

      : "Next";

}



function displayAnswerOptions() {

  const answerContainer =

    getElement("answerOptions");



  answerContainer.innerHTML = "";



  answerLabels.forEach((label, index) => {

    const answerValue = index + 1;



    const button =

      document.createElement("button");



    button.type = "button";

    button.className = "answer-button";



    if (answers[currentQuestion] === answerValue) {

      button.classList.add("selected");

    }



    const number =

      document.createElement("span");



    number.className = "answer-number";

    number.textContent = answerValue;



    button.append(

      number,

      document.createTextNode(label)

    );



    button.addEventListener("click", () => {

      answers[currentQuestion] = answerValue;

      displayQuestion();

    });



    answerContainer.appendChild(button);

  });

}



getElement("startButton")?.addEventListener(

  "click",

  () => {

    showSection("assessmentSection");

    displayQuestion();

  }

);



getElement("backButton")?.addEventListener(

  "click",

  () => {

    if (currentQuestion > 0) {

      currentQuestion--;

      displayQuestion();

    }

  }

);



getElement("nextButton")?.addEventListener(

  "click",

  async () => {

    if (answers[currentQuestion] === null) {

      return;

    }



    if (currentQuestion < questions.length - 1) {

      currentQuestion++;

      displayQuestion();

    } else {

      await requestAssessmentResult();

    }

  }

);



async function requestAssessmentResult() {

  try {

    const response = await fetch("/api/assess", {

      method: "POST",



      headers: {

        "Content-Type": "application/json"

      },



      body: JSON.stringify({

        answers

      })

    });



    const result = await response.json();

    if (!response.ok) {

      throw new Error(

        result.error ||

        "Unable to calculate the result."

      );

    }



    updateDashboard(result);

    displayResults(result);

  } catch (error) {

    alert(error.message);

  }

}



function displayResults(result) {

  getElement("overallScore").textContent =

    `${result.overallScore}%`;



  getElement("readinessLevel").textContent =

    result.readinessLevel;



  getElement("strongestArea").textContent =

    result.strongestArea;



  getElement("priorityArea").textContent =

    result.priorityArea;



  getElement("recommendationText").textContent =

    result.recommendation;



  const factorResults =

    getElement("factorResults");



  factorResults.innerHTML = "";



  Object.entries(result.scores).forEach(

    ([factor, score]) => {

      const card =

        document.createElement("div");



      card.className = "factor-result-card";



      const name =

        document.createElement("span");



      name.textContent = factorNames[factor];



      const value =

        document.createElement("strong");



      value.textContent = `${score}%`;



      card.append(name, value);

      factorResults.appendChild(card);

    }

  );



  showSection("resultsSection");

}



getElement("retakeButton")?.addEventListener(

  "click",

  () => {

    currentQuestion = 0;



    answers =

      new Array(questions.length).fill(null);



    showSection("homeSection");

  }

);





/* =================================

   CHATBOT

================================= */



const chatbotButton =

  getElement("chatbotButton");



const chatbotWindow =

  getElement("chatbotWindow");



const closeChatbot =

  getElement("closeChatbot");



const chatForm =

  getElement("chatForm");



const chatInput =

  getElement("chatInput");



const chatMessages =

  getElement("chatMessages");





chatbotButton?.addEventListener(

  "click",

  () => {

    chatbotWindow?.classList.toggle("open");

  }

);



closeChatbot?.addEventListener(

  "click",

  () => {

    chatbotWindow?.classList.remove("open");

  }

);



function addChatMessage(message, type) {

  const element =

    document.createElement("div");



  element.className =

    type === "user"

      ? "user-message"

      : "bot-message";



  element.textContent = message;



  chatMessages.appendChild(element);



  chatMessages.scrollTop =

    chatMessages.scrollHeight;

}



function getChatbotAnswer(question) {

  const text = question.toLowerCase();



  if (

    text.includes("payment method") ||

    text.includes("qr") ||

    text.includes("pos")

  ) {

    return "The suitable method depends on your customers and business activities. Small businesses can begin with LANKAQR or online banking, while businesses with frequent card payments may consider a POS terminal.";

  }



  if (

    text.includes("security") ||

    text.includes("fraud") ||

    text.includes("safe")

  ) {

    return "Use strong passwords, enable two-factor authentication, verify every transaction, limit account access, and never share OTP numbers or banking passwords.";

  }



  if (

    text.includes("infrastructure") ||

    text.includes("internet") ||

    text.includes("device")

  ) {

    return "Maintain reliable internet, suitable payment devices, updated applications, backup connectivity, and payment-provider support details.";

  }



  if (

    text.includes("literacy") ||

    text.includes("training") ||

    text.includes("skill")

  ) {

    return "Provide practical training on payment verification, transaction records, charges, fraud awareness, and failed or delayed payments.";

  }



  if (

    text.includes("usefulness") ||

    text.includes("benefit") ||

    text.includes("performance")

  ) {

    return "Digital payments can improve transaction speed, customer convenience, record keeping, financial monitoring, and business efficiency.";

  }



  if (

    text.includes("readiness") ||

    text.includes("ready") ||

    text.includes("score")

  ) {

    return "Complete the readiness assessment to identify strengths and improvement areas in adoption, infrastructure, financial literacy, and usefulness.";

  }



  if (

    text.includes("hello") ||

    text.includes("hi") ||

    text.includes("hey")

  ) {

    return "Hello! I can help with digital payments, infrastructure, security, training, payment methods, and SME readiness.";

  }



  return "Please ask about digital payment methods, infrastructure, security, digital financial literacy, business benefits, or payment readiness.";

}



function processChatQuestion(question) {

  const cleanQuestion = question.trim();



  if (!cleanQuestion) {

    return;

  }



  addChatMessage(cleanQuestion, "user");



  setTimeout(() => {

    addChatMessage(

      getChatbotAnswer(cleanQuestion),

      "bot"

    );

  }, 400);

}



chatForm?.addEventListener(

  "submit",

  event => {

    event.preventDefault();



    processChatQuestion(chatInput.value);



    chatInput.value = "";

    chatInput.focus();

  }

);



document

  .querySelectorAll(".quick-questions button")

  .forEach(button => {

    button.addEventListener(

      "click",

      () => {

        processChatQuestion(

          button.dataset.question || ""

        );

      }

    );

  });





/* =================================

   REGISTRATION AND LOGIN

================================= */



const registerForm =

  getElement("registerForm");



const loginForm =

  getElement("loginForm");



const authForms =

  getElement("authForms");



const userPanel =

  getElement("userPanel");



const welcomeUser =

  getElement("welcomeUser");



const userBusinessDetails =

  getElement("userBusinessDetails");



const registerMessage =

  getElement("registerMessage");



const loginMessage =

  getElement("loginMessage");



const logoutButton =

  getElement("logoutButton");



const accountResults =

  getElement("accountResults");



const accountResultsTitle =

  getElement("accountResultsTitle");



const accountResultsContent =

  getElement("accountResultsContent");





function showAccountMessage(

  element,

  message,

  type

) {

  if (!element) {

    return;

  }



  element.textContent = message;



  element.classList.remove(

    "success",

    "error"

  );



  element.classList.add(type);

}



function showLoggedInUser(user) {

  authForms?.classList.add("hidden");



  userPanel?.classList.remove("hidden");



  welcomeUser.textContent =

    `Welcome, ${user.businessName}`;



  userBusinessDetails.textContent =

    `${user.businessCategory} Business | ${user.email}`;

}



function showLoggedOutUser() {

  authForms?.classList.remove("hidden");



  userPanel?.classList.add("hidden");



  accountResults?.classList.add("hidden");

}



registerForm?.addEventListener(

  "submit",

  async event => {

    event.preventDefault();



    const payload = {

      businessName:

        getElement(

          "registerBusinessName"

        ).value.trim(),



      businessCategory:

        getElement(

          "registerCategory"

        ).value,



      email:

        getElement(

          "registerEmail"

        ).value.trim(),



      password:

        getElement(

          "registerPassword"

        ).value

    };



    showAccountMessage(

      registerMessage,

      "Creating your account...",

      "success"

    );



    try {

      const response =

        await fetch("/api/register", {

          method: "POST",



          headers: {

            "Content-Type":

              "application/json"

          },



          body: JSON.stringify(payload)

        });



      const data =

        await response.json();



      if (!response.ok) {

        throw new Error(

          data.error ||

          "Registration failed."

        );

      }



      showAccountMessage(

        registerMessage,

        "Account created successfully.",

        "success"

      );



      registerForm.reset();



      showLoggedInUser(data.user);

    } catch (error) {

      showAccountMessage(

        registerMessage,

        error.message,

        "error"

      );

    }

  }

);



loginForm?.addEventListener(

  "submit",

  async event => {

    event.preventDefault();



    const payload = {

      email:

        getElement(

          "loginEmail"

        ).value.trim(),



      password:

        getElement(

          "loginPassword"

        ).value

    };



    showAccountMessage(

      loginMessage,

      "Logging in...",

      "success"

    );



    try {

      const response =

        await fetch("/api/login", {

          method: "POST",



          headers: {

            "Content-Type":

              "application/json"

          },



          body: JSON.stringify(payload)

        });



      const data =

        await response.json();



      if (!response.ok) {

        throw new Error(

          data.error || "Login failed."

        );

      }



      showAccountMessage(

        loginMessage,

        "Login successful.",

        "success"

      );



      loginForm.reset();



      showLoggedInUser(data.user);

    } catch (error) {

      showAccountMessage(

        loginMessage,

        error.message,

        "error"

      );

    }

  }

);



logoutButton?.addEventListener(

  "click",

  async () => {

    try {

      const response =

        await fetch("/api/logout", {

          method: "POST"

        });



      const data =

        await response.json();



      if (!response.ok) {

        throw new Error(

          data.error || "Logout failed."

        );

      }



      showLoggedOutUser();



      registerMessage.textContent = "";

      loginMessage.textContent = "";

    } catch (error) {

      alert(error.message);

    }

  }

);



async function checkCurrentUser() {

  try {

    const response =

      await fetch("/api/me");



    const data =

      await response.json();



    if (data.loggedIn) {

      showLoggedInUser(data.user);

    } else {

      showLoggedOutUser();

    }

  } catch (error) {

    console.error(

      "Unable to check login status:",

      error

    );



    showLoggedOutUser();

  }

}



checkCurrentUser();





/* =================================

   ASSESSMENT HISTORY

================================= */



getElement("viewHistoryButton")

  ?.addEventListener(

    "click",

    async () => {

      accountResults.classList.remove(

        "hidden"

      );



      accountResultsTitle.textContent =

        "Assessment History";



      accountResultsContent.textContent =

        "Loading your assessment history...";



      try {

        const response =

          await fetch("/api/history");



        const data =

          await response.json();



        if (!response.ok) {

          throw new Error(

            data.error ||

            "Assessment history could not be loaded."

          );

        }



        accountResultsContent.innerHTML = "";



        if (!data.assessments.length) {

          accountResultsContent.textContent =

            "No results are available. Complete your first readiness assessment.";



          return;

        }



        data.assessments.forEach(

          (assessment, index) => {

            const card =

              document.createElement("div");



            card.className =

              "history-card";



            const details = [

              `Assessment ${data.assessments.length - index}`,



              `Date: ${new Date(

                assessment.assessmentDate

              ).toLocaleString()}`,



              `Business Category: ${assessment.businessCategory}`,



              `Overall Score: ${assessment.overallScore}%`,



              `Readiness Level: ${assessment.readinessLevel}`,



              `DPA: ${assessment.dpaScore}% | IA: ${assessment.iaScore}% | DFL: ${assessment.dflScore}% | PU: ${assessment.puScore}%`,



              `Priority Area: ${assessment.priorityArea}`

            ];



            details.forEach(

              (text, detailIndex) => {

                const element =

                  document.createElement(

                    detailIndex === 0

                      ? "h4"

                      : "p"

                  );



                element.textContent = text;



                card.appendChild(element);

              }

            );



            accountResultsContent.appendChild(

              card

            );

          }

        );

      } catch (error) {

        accountResultsContent.textContent =

          error.message;

      }

    }

  );





/* =================================

   PROGRESS COMPARISON

================================= */



getElement("viewProgressButton")

  ?.addEventListener(

    "click",

    async () => {

      accountResults.classList.remove(

        "hidden"

      );



      accountResultsTitle.textContent =

        "Readiness Progress";



      accountResultsContent.textContent =

        "Loading your progress...";



      try {

        const response =

          await fetch("/api/progress");



        const data =

          await response.json();



        if (!response.ok) {

          throw new Error(

            data.error ||

            "Progress could not be loaded."

          );

        }



        accountResultsContent.innerHTML = "";



        if (!data.current) {

          accountResultsContent.textContent =

            "Complete your first assessment to start tracking progress.";



          return;

        }



        const card =

          document.createElement("div");



        card.className = "progress-card";



        if (!data.previous) {

          card.textContent =

            `Your first assessment was saved with an overall score of ${data.current.overallScore}%. Complete another assessment to compare progress.`;



          accountResultsContent.appendChild(

            card

          );



          return;

        }



        const lines = [

          data.message,



          `Previous Overall Score: ${data.previous.overallScore}%`,



          `Current Overall Score: ${data.current.overallScore}%`,



          `Overall Change: ${

            data.change.overallScore > 0

              ? "+"

              : ""

          }${data.change.overallScore}%`,



          `Digital Payment Adoption: ${

            data.change.dpaScore > 0

              ? "+"

              : ""

          }${data.change.dpaScore}%`,



          `Infrastructure Availability: ${

            data.change.iaScore > 0

              ? "+"

              : ""

          }${data.change.iaScore}%`,



          `Digital Financial Literacy: ${

            data.change.dflScore > 0

              ? "+"

              : ""

          }${data.change.dflScore}%`,



          `Perceived Usefulness: ${

            data.change.puScore > 0

              ? "+"

              : ""

          }${data.change.puScore}%`

        ];



        lines.forEach((text, index) => {

          const element =

            document.createElement(

              index === 0 ? "h4" : "p"

            );



          element.textContent = text;



          if (index >= 3) {

            const matchedValue =

              text.match(

                /[-+]?\d+(?=%)/

              );



            const value = Number(

              matchedValue

                ? matchedValue[0]

                : 0

            );



            element.className =

              value >= 0

                ? "positive-change"

                : "negative-change";

          }



          card.appendChild(element);

        });



        accountResultsContent.appendChild(

          card

        );

      } catch (error) {

        accountResultsContent.textContent =

          error.message;

      }

    }

  );const chatbotHelper =

  document.getElementById("chatbotHelper");



chatbotHelper?.addEventListener(

  "click",

  () => {

    chatbotWindow.classList.add("open");

    chatbotHelper.classList.add("hide-helper");

  }

);



chatbotButton?.addEventListener(

  "click",

  () => {

    if (

      chatbotWindow.classList.contains("open")

    ) {

      chatbotHelper?.classList.add(

        "hide-helper"

      );

    } else {

      chatbotHelper?.classList.remove(

        "hide-helper"

      );

    }

  }

);



closeChatbot?.addEventListener(

  "click",

  () => {

    chatbotHelper?.classList.remove(

      "hide-helper"

    );

  }

);/* =================================

   NAVIGATION

================================= */



const mobileMenuButton =

  document.getElementById("mobileMenuButton");



const navigationLinks =

  document.getElementById("navigationLinks");



function closeMobileNavigation() {

  navigationLinks?.classList.remove("open");

}



mobileMenuButton?.addEventListener(

  "click",

  () => {

    navigationLinks?.classList.toggle("open");

  }

);



document

  .querySelectorAll(".navigation-links a")

  .forEach(link => {

    link.addEventListener(

      "click",

      closeMobileNavigation

    );

  });



document

  .getElementById("assessmentNav")

  ?.addEventListener("click", () => {

    showSection("assessmentSection");

    displayQuestion();

    closeMobileNavigation();

  });



document

  .getElementById("dashboardNav")

  ?.addEventListener("click", () => {

    showSection("dashboard");

    closeMobileNavigation();

  });



document

  .getElementById("historyNav")

  ?.addEventListener("click", () => {

    document

      .getElementById("accountSection")

      ?.scrollIntoView({

        behavior: "smooth"

      });



    document

      .getElementById("viewHistoryButton")

      ?.click();



    closeMobileNavigation();

  });



document

  .getElementById("progressNav")

  ?.addEventListener("click", () => {

    document

      .getElementById("accountSection")

      ?.scrollIntoView({

        behavior: "smooth"

      });



    document

      .getElementById("viewProgressButton")

      ?.click();



    closeMobileNavigation();

  });



document

  .getElementById("supportNav")

  ?.addEventListener("click", () => {

    chatbotWindow?.classList.add("open");



    document

      .getElementById("chatbotHelper")

      ?.classList.add("hide-helper");



    closeMobileNavigation();

  });



document

  .getElementById("homeNav")

  ?.addEventListener("click", event => {

    event.preventDefault();



    showSection("homeSection");

    closeMobileNavigation();

  });



function updateDashboard(result) {

  if (!result) return;



  document.getElementById("dashboardScore").textContent =

    result.overallScore + "%";



  document.getElementById("dashboardLevel").textContent =

    result.readinessLevel;



  document.getElementById("dashboardStrongest").textContent =

    result.strongestArea;



  document.getElementById("dashboardPriority").textContent =

    result.priorityArea;



  document.getElementById("dashboardRecommendation").textContent =

    result.recommendation;



  const factorScores = {

    dpa: result.scores.dpa,

    ia: result.scores.ia,

    dfl: result.scores.dfl,

    pu: result.scores.pu

  };



  Object.entries(factorScores).forEach(([factor, score]) => {

    const valueElement = document.getElementById(`${factor}Value`);

    const barElement = document.getElementById(`${factor}Bar`);



    if (valueElement) {

      valueElement.textContent = score + "%";

    }



    if (barElement) {

      barElement.style.width = score + "%";

    }

  });

}