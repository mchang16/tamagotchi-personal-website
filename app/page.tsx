"use client";
import {
  DragDropProvider,
  PointerSensor,
  useDraggable,
  useDroppable,
} from "@dnd-kit/react";
import { useState, useEffect, useMemo, useRef } from "react";
import "./styles.css";
import React from "react";

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

const extractText = (node: React.ReactNode): string => {
  return React.Children.toArray(node).reduce<string>((text, child) => {
    if (child == null || typeof child === "boolean") {
      return text;
    }

    if (typeof child === "string" || typeof child === "number") {
      return text + String(child);
    }

    if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
      return text + extractText(child.props.children);
    }

    return text;
  }, "");
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

type InlineTypewriterSegment = {
  text: string;
  href?: string;
  strong?: boolean;
  onClick?: () => void;
};

type InlineTypewriterPage = {
  segments: InlineTypewriterSegment[];
  afterContent?: React.ReactNode;
};

type InlineTypewriterProps = {
  speed?: number;
  charLimit?: number;
  className?: string;
  inline?: boolean;
  onComplete?: () => void;
} & (
  | { segments: InlineTypewriterSegment[]; pages?: never }
  | { pages: InlineTypewriterPage[]; segments?: never }
);

function InlineTypewriter({
  segments,
  pages,
  speed = 30,
  charLimit = 250,
  className,
  inline = false,
  onComplete,
}: InlineTypewriterProps) {
  const [typedCount, setTypedCount] = useState(0);
  const [pageStart, setPageStart] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const completionNotified = useRef(false);
  const allSegments = pages ? pages.flatMap((page) => page.segments) : segments;
  const fullText = allSegments.map((segment) => segment.text).join("");
  const pageRanges = pages?.reduce<
    Array<{ end: number; afterContent?: React.ReactNode }>
  >((ranges, page) => {
    const start = ranges.at(-1)?.end ?? 0;
    const pageLength = page.segments.reduce(
      (length, segment) => length + segment.text.length,
      0,
    );
    return [
      ...ranges,
      { end: start + pageLength, afterContent: page.afterContent },
    ];
  }, []);
  const pageEnd = inline
    ? fullText.length
    : (pageRanges?.[currentPage]?.end ??
      roundWord(fullText, Math.min(pageStart + charLimit, fullText.length)));

  const hasNextPage = pageRanges
    ? currentPage < pageRanges.length - 1
    : pageEnd < fullText.length;

  useEffect(() => {
    if (typedCount >= pageEnd) {
      if (typedCount >= fullText.length && !completionNotified.current) {
        completionNotified.current = true;
        onComplete?.();
      }
      return;
    }

    const timer = setTimeout(() => {
      setTypedCount((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [fullText.length, onComplete, pageEnd, speed, typedCount]);

  const onNextPage = () => {
    if (!hasNextPage) return;

    setHistory((previousHistory) => [
      ...previousHistory.slice(0, currentPage),
      pageStart,
    ]);
    setCurrentPage((previousPage) => previousPage + 1);
    setPageStart(pageEnd);
    setTypedCount(pageEnd);
  };

  const onPrevPage = () => {
    const previousPageStart = history[currentPage - 1];
    if (previousPageStart === undefined) return;

    setCurrentPage((previousPage) => previousPage - 1);
    setPageStart(previousPageStart);
    setTypedCount(previousPageStart);
  };

  const segmentRanges = allSegments.reduce<
    Array<{
      segment: InlineTypewriterSegment;
      start: number;
      end: number;
    }>
  >((ranges, segment) => {
    const start = ranges.at(-1)?.end ?? 0;
    return [...ranges, { segment, start, end: start + segment.text.length }];
  }, []);
  const Wrapper = inline ? "span" : "div";

  const content = (
    <Wrapper className={className}>
      {segmentRanges.map(({ segment, start, end }, index) => {
        const visibleStart = Math.max(start, pageStart);
        const visibleEnd = Math.min(end, typedCount, pageEnd);
        const visibleLength = Math.max(0, visibleEnd - visibleStart);
        if (visibleLength === 0) return null;

        const visibleText = segment.text.slice(
          visibleStart - start,
          visibleStart - start + visibleLength,
        );
        const content = segment.strong ? (
          <strong>{visibleText}</strong>
        ) : (
          visibleText
        );

        if (segment.onClick) {
          return (
            <button
              key={index}
              type="button"
              className="selection-child selection-option"
              onClick={segment.onClick}
            >
              {content}
            </button>
          );
        }

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
            <React.Fragment key={index}>{content}</React.Fragment>
          );
        }

        return <React.Fragment key={index}>{content}</React.Fragment>;
      })}
    </Wrapper>
  );

  if (inline) return content;

  return (
    <div className="text-container">
      <div className="text">{content}</div>
      <div className="set-of-buttons">
        {currentPage !== 0 && (
          <button onClick={onPrevPage} className="prev-button">
            <div className="prev-icon" />
            Prev
          </button>
        )}
        {hasNextPage && (
          <button onClick={onNextPage} className="next-button">
            Next
            <div className="next-icon" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [currentIcon, setCurrentIcon] = useState<string | null>(null);
  const [modalSelection, setModalSelection] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
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
  };
  return (
    <DragDropProvider
      sensors={[PointerSensor]}
      onDragEnd={(event) => {
        if (event.canceled) return;

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
                      Welcome! Get to know me by clicking or dragging and
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
                    <InlineTypewriter
                      className="selection-group"
                      pages={[
                        {
                          segments: [
                            {
                              text: "Full Stack Software Enginner - Okta(Auth0) - Activations team",
                              onClick: () =>
                                handleSelection("activations-team"),
                            },
                            {
                              text: "Full Stack Software Enginner - Okta(Auth0) - Growth team",
                              onClick: () => handleSelection("growth-team"),
                            },
                          ],
                        },
                        {
                          segments: [
                            {
                              text: "Design Exploration - The Tamagotchi Handbook (WIP): ",
                            },
                            {
                              text: "Figma",
                              href: "https://www.figma.com/design/TlF8dtnubNENJmpunnjFc4/The-Tamagotchi-Handbook?node-id=49-74&t=4uCnYseGooNyakmR-1",
                            },
                          ],
                        },
                      ]}
                    />
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
                            href: "https://drive.google.com/file/d/13WSD0JbLSkgMZTbkJlKaF5b0MR_sYH2v/view?usp=sharing",
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
