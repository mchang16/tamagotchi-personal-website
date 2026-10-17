"use client";
import {
  DragDropProvider,
  PointerSensor,
  useDraggable,
  useDroppable,
} from "@dnd-kit/react";
import { useState, useEffect, useMemo, useRef } from "react";
import "./styles.css";

function Draggable({
  id,
  icon,
  handleEnter,
}: {
  id: string;
  icon: string;
  handleEnter: (id: string) => void;
}) {
  const { ref } = useDraggable({ id });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    event.stopPropagation();
    handleEnter(id);
  };

  return (
    <button
      type="button"
      ref={ref}
      className="icon"
      onKeyDown={handleKeyDown}
      onClick={() => handleEnter(id)}
      aria-label={id}
    >
      <img className="icon-image" src={icon} alt="" />
      {id}
    </button>
  );
}

function Droppable({
  id,
  children,
}: {
  id: string;
  children?: React.ReactNode;
}) {
  const { ref } = useDroppable({ id });

  return (
    <div ref={ref} className="character">
      {children}
    </div>
  );
}

const extractText = (node: React.ReactNode) => {
  let fullText = "";
  for (const item of node) {
    if (item.type === "a") {
      fullText += item.props.children;
    } else {
      fullText += item;
    }
  }

  return fullText;
};

const roundWord = (text: string, pageEnd: number) => {
  let tempPageEnd = 0;

  if (text.charAt(pageEnd) === " ") {
    for (let i = pageEnd; i < text.length; i++) {
      if (text.charAt(i) !== " ") {
        break;
      }
      tempPageEnd++;
    }
    return pageEnd - tempPageEnd;
  } else {
    for (let i = pageEnd; i < text.length; i++) {
      if (text.charAt(i) === " ") {
        break;
      }
      tempPageEnd++;
    }
    return pageEnd + tempPageEnd;
  }
};

const Text = ({
  children,
  speed = 100,
  charLimit = 250,
}: {
  children: React.ReactNode;
  speed?: number;
  charLimit?: number;
}) => {
  const [currentText, setCurrentText] = useState<string>("");
  // typing index
  const [index, setIndex] = useState<number>(0);
  const [pageStart, setPageStart] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [history, setHistory] = useState<number[]>([]);

  const fullText = useMemo(() => extractText(children), [children]);

  let pageEnd = roundWord(
    fullText,
    Math.min(pageStart + charLimit, fullText.length),
  );

  useEffect(() => {
    if (index >= pageEnd) return;

    const timeoutId = setTimeout(() => {
      setCurrentText((prev) => prev + fullText.charAt(index));
      setIndex((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timeoutId);
  }, [children, index, pageEnd, speed]);

  const onNextPage = () => {
    if (pageEnd >= fullText.length) return;
    setCurrentText("");
    if (!history.includes(pageStart)) {
      setHistory((prev) => [...prev, pageStart]);
    }
    setCurrentPage((prev) => prev + 1);
    setIndex(pageEnd);
    setPageStart(pageEnd);
  };

  const onPrevPage = () => {
    setCurrentText("");
    setCurrentPage(currentPage - 1);
    setIndex(history[currentPage - 1]);
    setPageStart(history[currentPage - 1]);
  };

  return (
    <div className="text-container">
      <div className={"text"}>{currentText}</div>
      <div className="set-of-buttons">
        {currentPage !== 0 && (
          <button onClick={() => onPrevPage()} className="prev-button">
            <div className="prev-icon" />
            Prev
          </button>
        )}
        {pageEnd !== fullText.length && (
          <button onClick={() => onNextPage()} className="next-button">
            Next
            <div className="next-icon" />
          </button>
        )}
      </div>
    </div>
  );
};

function InlineTypewriter({
  segments,
  speed = 30,
  className,
  inline = false,
  onComplete,
}: {
  segments: Array<{ text: string; href?: string; strong?: boolean }>;
  speed?: number;
  className?: string;
  inline?: boolean;
  onComplete?: () => void;
}) {
  const [typedCount, setTypedCount] = useState(0);
  const completionNotified = useRef(false);
  const fullText = segments.map((segment) => segment.text).join("");

  useEffect(() => {
    if (typedCount >= fullText.length) {
      if (!completionNotified.current) {
        completionNotified.current = true;
        onComplete?.();
      }
      return;
    }

    const timer = setTimeout(() => {
      setTypedCount((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [fullText.length, onComplete, speed, typedCount]);

  let startOfSegment = 0;
  const Wrapper = inline ? "span" : "div";

  return (
    <Wrapper className={className}>
      {segments.map((segment, index) => {
        const start = startOfSegment;
        const end = start + segment.text.length;
        const visibleLength = Math.max(
          0,
          Math.min(segment.text.length, typedCount - start),
        );
        startOfSegment = end;
        const visibleText = segment.text.slice(0, visibleLength);
        const content = segment.strong ? (
          <strong>{visibleText}</strong>
        ) : (
          visibleText
        );

        if (segment.href) {
          return typedCount >= end ? (
            <a
              key={index}
              href={segment.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="External site (opens in new window)"
            >
              {content}
            </a>
          ) : (
            <span key={index}>{content}</span>
          );
        }

        return <span key={index}>{content}</span>;
      })}
    </Wrapper>
  );
}

export default function Home() {
  const [currentIcon, setCurrentIcon] = useState<string | null>(null);
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);
  const [modalSelection, setModalSelection] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [experienceIntroComplete, setExperienceIntroComplete] = useState(false);
  const [isCaught, setIsCaught] = useState(false);
  const [caughtPosition, setCaughtPosition] = useState([0, 0]);

  const getModalContent = (): React.ReactNode => {
    switch (modalSelection) {
      case "activations-team":
        return (
          <>
            <h2 style={{ fontWeight: "bold" }}>
              Full Stack Software Engineer - Activations Team (2024 - Present)
            </h2>
            <br />
            <ul>
              <li>
                Architected and executed A/B experiments across onboarding flows
                and quickstart guides to drive newly signed-up user activation
                rates and login conversion, leading to a +12% increase in user
                activation and +38% time-to-value within one year.
              </li>

              <br />
              <li>
                Partnered with Product, Design, and UX Research teams to
                iteratively improve onboarding experiences using behavioral
                telemetry and qualitative feedback.
              </li>

              <br />
              <li>
                <strong>Tech Stack:</strong> JavaScript, TypeScript, React,
                Node.js, Git, Datadog
              </li>
            </ul>
          </>
        );
      case "growth-team":
        return (
          <>
            <h2 style={{ fontWeight: "bold" }}>
              Full Stack Software Engineer - Growth Team (2021 - 2023)
            </h2>
            <br />

            <ul>
              <li>
                Engineered and maintained core infrastructure for subscription
                lifecycles, account tiering, and dynamic feature access across
                new product pricing rollouts.
              </li>
              <br />
              <li>
                Triaged and resolved complex customer billing and account
                support tickets, unblocking enterprise clients and improving
                platform reliability.
              </li>
              <br />
              <li>
                <strong>Tech Stack:</strong> JavaScript, TypeScript, React,
                Node.js, Git, Datadog
              </li>
            </ul>
          </>
        );
    }
  };

  const handleSelection = (selection: string) => {
    setModalOpen(true);
    setModalSelection(selection);
  };

  const caughtMametchi = (e: React.MouseEvent<HTMLImageElement>) => {
    setIsCaught(true);

    console.log(e);
    const container = e.currentTarget.closest(".square-wrap");
    if (!container) return;

    const bounds = container.getBoundingClientRect();

    // left
    if (e.clientX - bounds.left < 0) {
      setCaughtPosition([
        e.clientX - bounds.left - 90,
        e.clientY - bounds.top - 90,
      ]);

      return;
    }

    // top
    if (e.clientY - bounds.top < 0) {
      setCaughtPosition([e.clientX - bounds.left, e.clientY - bounds.top - 90]);
      return;
    }

    // right
    if (e.clientX - bounds.left > e.clientY - bounds.top) {
      setCaughtPosition([e.clientX - bounds.left, e.clientY - bounds.top - 90]);

      return;
    }

    // bottom
    if (e.clientX - bounds.left < e.clientY - bounds.top) {
      setCaughtPosition([e.clientX - bounds.left, e.clientY - bounds.top]);
      return;
    }
    console.log(e.clientX - bounds.left, e.clientY - bounds.top);
  };
  return (
    <DragDropProvider
      sensors={[PointerSensor]}
      onDragEnd={(event) => {
        if (event.canceled) return;

        setExperienceIntroComplete(false);
        const targetId = event.operation.target?.id;
        if (targetId === "droppable") {
          setCurrentIcon(event.operation.source?.id as string);
        } else {
          setCurrentIcon(null);
        }
      }}
    >
      <div className="background">
        <div className="background-mametchi">
          <div className="flex">
            <div className="square-wrap">
              {!isCaught && (
                <img
                  className="mametchi"
                  src={"/mametchi.png"}
                  onClick={caughtMametchi}
                />
              )}
              <div
                className="parentMametchi"
                style={{ left: caughtPosition[0], top: caughtPosition[1] }}
              >
                {isCaught && (
                  <>
                    <img className="caught-text" src={"/caught.png"} />
                    <img
                      className="mametchi-caught"
                      src={"/mametchi.png"}
                      onClick={(e) => caughtMametchi(e)}
                    />
                  </>
                )}
              </div>
              <div className="square">
                <div className="icon-sidebar">
                  {currentIcon !== "about" && (
                    <Draggable
                      id="about"
                      icon="/icon-about-me.png"
                      key="about"
                      handleEnter={setCurrentIcon}
                    />
                  )}
                  {currentIcon !== "experience" && (
                    <Draggable
                      id="experience"
                      icon="/icon-work.png"
                      key="experience"
                      handleEnter={setCurrentIcon}
                    />
                  )}
                  {currentIcon !== "contact" && (
                    <Draggable
                      id="contact"
                      icon="/icon-contact.png"
                      key="contact"
                      handleEnter={setCurrentIcon}
                    />
                  )}
                  {currentIcon !== "resume" && (
                    <Draggable
                      id="resume"
                      icon="/icon-resume.png"
                      key="resume"
                      handleEnter={setCurrentIcon}
                    />
                  )}
                </div>
                <div className="content">
                  <Droppable id="droppable">
                    {(currentIcon === null || currentIcon === "resume") && (
                      <div className="transition-container">
                        <div
                          className="pixel-art-waving"
                          role="img"
                          aria-label="Girl talking on phone animation"
                        />
                      </div>
                    )}

                    {currentIcon === "contact" && (
                      <div className="transition-container">
                        <div
                          className="pixel-art-talking"
                          role="img"
                          aria-label="Girl talking on phone animation"
                        />
                      </div>
                    )}
                    {currentIcon === "about" && (
                      <div className="transition-container">
                        <div
                          className="pixel-art-knitting"
                          role="img"
                          aria-label="Girl knitting animation"
                        ></div>
                      </div>
                    )}
                    {currentIcon === "experience" && (
                      <div className="transition-container">
                        <div
                          className="pixel-art-computer"
                          role="img"
                          aria-label="Girl typing at computer animation"
                        />
                      </div>
                    )}
                  </Droppable>
                </div>
                <div className="description">
                  {currentIcon === null && (
                    <Text speed={30}>
                      Welcome! Get to know me by clicking or draggin and
                      dropping those icons!
                    </Text>
                  )}

                  {currentIcon === "about" && (
                    <Text speed={30}>
                      Hi there! I'm Michelle, a software engineer with a
                      background in full-stack development and user experience
                      design. I love staying creative in my free time, so when
                      I'm away from my screen, you'll usually find me crafting
                      something—whether that's knitting a new project,
                      experimenting with new baking recipes, or relaxing with a
                      cozy video game.
                    </Text>
                  )}

                  {currentIcon === "experience" && (
                    <>
                      {" "}
                      <div>
                        <InlineTypewriter
                          speed={30}
                          segments={[
                            {
                              text: "My full-stack journey at Auth0 covers two main areas: building billing infrastructure on the ",
                            },
                            { text: "Growth", strong: true },
                            {
                              text: " team, and scaling user sign-ups on the ",
                            },
                            { text: "Activations", strong: true },
                            {
                              text: " team. Choose a team below to learn more!",
                            },
                          ]}
                          onComplete={() => setExperienceIntroComplete(true)}
                        />
                      </div>
                      {experienceIntroComplete && (
                        <div className="selection-group">
                          <div>
                            {currentSelection === "first-team" && (
                              <div className="selection-icon" />
                            )}

                            <button
                              className="selection-child"
                              aria-label="Activations team"
                              onMouseEnter={() =>
                                setCurrentSelection("first-team")
                              }
                              onMouseLeave={() => setCurrentSelection(null)}
                              onClick={() =>
                                handleSelection("activations-team")
                              }
                            >
                              <InlineTypewriter
                                inline
                                segments={[{ text: "Activations team" }]}
                              />
                            </button>
                          </div>
                          <div>
                            {currentSelection === "second-team" && (
                              <div className="selection-icon" />
                            )}

                            <button
                              className="selection-child"
                              aria-label="Growth team"
                              onMouseEnter={() =>
                                setCurrentSelection("second-team")
                              }
                              onMouseLeave={() => setCurrentSelection(null)}
                              onClick={() => handleSelection("growth-team")}
                            >
                              <InlineTypewriter
                                inline
                                segments={[{ text: "Growth team" }]}
                              />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {currentIcon === "contact" && (
                    <>
                      <InlineTypewriter
                        speed={30}
                        segments={[{ text: "Email: mchang0816@gmail.com" }]}
                      />
                      <br />
                      <InlineTypewriter
                        speed={30}
                        segments={[
                          { text: "LinkedIn: " },
                          {
                            text: "https://www.linkedin.com/in/michelle-chang-94890014a",
                            href: "https://www.linkedin.com/in/michelle-chang-94890014a",
                          },
                        ]}
                      />
                    </>
                  )}

                  {currentIcon === "resume" && (
                    <div className="text-group">
                      <InlineTypewriter
                        speed={30}
                        segments={[
                          { text: "Click " },
                          {
                            text: "here",
                            href: "https://drive.google.com/file/d/1M35VkfrT0X1TGw2NzLzriix23Le2uMs9/view?usp=drive_link",
                          },
                          { text: " to view my resume!" },
                        ]}
                      />
                    </div>
                  )}

                  <Modal open={modalOpen} setModalOpen={setModalOpen}>
                    {getModalContent()}
                  </Modal>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DragDropProvider>
  );
}

const Modal = ({
  children,
  open,
  setModalOpen,
}: {
  children: React.ReactNode;
  open: boolean;
  setModalOpen: Function;
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (open) {
      dialog?.showModal();
    } else {
      dialog?.close();
    }
  }, [open]);

  return (
    <dialog ref={dialogRef} className="description modal-container">
      <button
        className="modal-close-button"
        onClick={() => setModalOpen(false)}
      >
        <div className="close-icon" />
      </button>
      <div className="modal-content">{children}</div>
    </dialog>
  );
};
