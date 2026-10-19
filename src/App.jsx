
import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  Activity, Bell, Bookmark, Check, ChevronDown, Compass, Heart,
  Image as ImageIcon, MessageCircle, MoreHorizontal, Plus, Search,
  Send, Settings, Shield, Smile, Sparkles, UserPlus, Users, X,
  Camera, Globe, Lock, Radio, Home, LogOut
} from "lucide-react";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

const seedPeople = [
  {
    id: "me",
    name: "Tayeiba Tariq",
    handle: "@tayeiba",
    avatar: "TT",
    color: "violet",
    role: "Frontend Developer",
    bio: "Learning, building, and sharing the journey ✨",
    privacy: "Public"
  },
  {
    id: "maya",
    name: "Maya Chen",
    handle: "@mayacreates",
    avatar: "MC",
    color: "rose",
    role: "Product Designer",
    bio: "Designing little things that make a big difference.",
    privacy: "Public"
  },
  {
    id: "alex",
    name: "Alex Morgan",
    handle: "@alexbuilds",
    avatar: "AM",
    color: "blue",
    role: "Full-stack Developer",
    bio: "Building useful things for the internet.",
    privacy: "Friends"
  },
  {
    id: "noor",
    name: "Noor Ahmed",
    handle: "@noorwrites",
    avatar: "NA",
    color: "amber",
    role: "Writer & Learner",
    bio: "Curious mind. Lifelong student.",
    privacy: "Public"
  }
];

const initialPosts = [
  {
    id: "p1",
    author: "maya",
    text: "A reminder that progress is still progress, even when it feels small. Keep showing up for the things you care about. 🌱",
    image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=80",
    time: "18 min ago",
    likes: ["alex", "noor"],
    comments: [
      { id: "c1", author: "noor", text: "Needed this today 💛" }
    ],
    privacy: "Public"
  },
  {
    id: "p2",
    author: "alex",
    text: "Just shipped a new side project! The best way to learn is to build, break things, and try again. What are you working on this week?",
    time: "1 hr ago",
    likes: ["me"],
    comments: [
      { id: "c2", author: "me", text: "Love this mindset!" },
      { id: "c3", author: "maya", text: "Congrats on shipping 🚀" }
    ],
    privacy: "Friends"
  },
  {
    id: "p3",
    author: "noor",
    text: "Today's goal: learn one new thing, help one person, and take one step closer to the future I want. What's your goal?",
    time: "3 hrs ago",
    likes: ["maya", "me", "alex"],
    comments: [],
    privacy: "Public"
  }
];

const initialNotifications = [
  {
    id: "n1",
    text: "Maya Chen liked your post.",
    time: "5 min ago",
    read: false,
    icon: "heart"
  },
  {
    id: "n2",
    text: "Alex Morgan commented on your post.",
    time: "24 min ago",
    read: false,
    icon: "comment"
  },
  {
    id: "n3",
    text: "Noor Ahmed sent you a friend request.",
    time: "1 hr ago",
    read: true,
    icon: "friend"
  }
];

const readStore = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const saveStore = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

function Avatar({ person, size = "md" }) {
  return (
    <div
      className={`avatar ${person?.color || "violet"} ${size}`}
      aria-label={person?.name}
    >
      {person?.avatar || "?"}
    </div>
  );
}

function App() {
  const [people, setPeople] = useState(() =>
    readStore("orbit-people", seedPeople)
  );
  const [posts, setPosts] = useState(() =>
    readStore("orbit-posts", initialPosts)
  );
  const [notifications, setNotifications] = useState(() =>
    readStore("orbit-notifications", initialNotifications)
  );
  const [requests, setRequests] = useState(() =>
    readStore("orbit-requests", ["noor"])
  );
  const [friends, setFriends] = useState(() =>
    readStore("orbit-friends", ["maya", "alex"])
  );
  const [privacy, setPrivacy] = useState(() =>
    readStore("orbit-privacy", "Public")
  );

  const [active, setActive] = useState("Home");
  const [search, setSearch] = useState("");
  const [exploreSearch, setExploreSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [media, setMedia] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentOpen, setCommentOpen] = useState({});
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileName, setProfileName] = useState("Tayeiba Tariq");
  const [profileBio, setProfileBio] = useState(
    "Learning, building, and sharing the journey ✨"
  );
  const [toast, setToast] = useState("");
  const [live, setLive] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const fileRef = useRef(null);
  const socketRef = useRef(null);

  const me = {
    ...(people.find(p => p.id === "me") || seedPeople[0]),
    name: profileName,
    bio: profileBio,
    privacy
  };

  const personById = id =>
    id === "me"
      ? me
      : people.find(p => p.id === id) || seedPeople[0];

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    saveStore("orbit-people", people);
  }, [people]);

  useEffect(() => {
    saveStore("orbit-posts", posts);
  }, [posts]);

  useEffect(() => {
    saveStore("orbit-notifications", notifications);
  }, [notifications]);

  useEffect(() => {
    saveStore("orbit-requests", requests);
  }, [requests]);

  useEffect(() => {
    saveStore("orbit-friends", friends);
  }, [friends]);

  useEffect(() => {
    saveStore("orbit-privacy", privacy);
  }, [privacy]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      reconnectionAttempts: 4,
      timeout: 2500
    });

    socketRef.current = socket;

    socket.on("connect", () => setLive(true));
    socket.on("disconnect", () => setLive(false));

    socket.on("feed:update", event => {
      if (event.type === "post") {
        setToast("A new post arrived in real time.");
      } else if (event.type === "comment") {
        setToast("A new comment arrived.");
      } else {
        setToast("Feed updated live.");
      }

      if (event.type === "post" && event.payload?.post) {
        setPosts(old =>
          old.some(p => p.id === event.payload.post.id)
            ? old
            : [event.payload.post, ...old]
        );
      }

      if (event.type === "like" && event.payload) {
        setPosts(old =>
          old.map(p =>
            p.id === event.payload.postId
              ? {
                  ...p,
                  likes: event.payload.liked
                    ? [...new Set([...p.likes, event.payload.userId])]
                    : p.likes.filter(id => id !== event.payload.userId)
                }
              : p
          )
        );
      }

      if (event.type === "comment" && event.payload) {
        setPosts(old =>
          old.map(p =>
            p.id === event.payload.postId
              ? { ...p, comments: [...p.comments, event.payload.comment] }
              : p
          )
        );
      }

      if (event.type === "profile" && event.payload?.person) {
        setPeople(old =>
          old.map(p =>
            p.id === event.payload.person.id
              ? event.payload.person
              : p
          )
        );
      }
    });

    socket.on("notification:new", event => {
      const item = {
        id: `n${Date.now()}`,
        text: `${event.payload?.name || "Someone"} sent you a friend request.`,
        time: "Just now",
        read: false,
        icon: "friend"
      };

      setNotifications(old => [item, ...old]);
    });

    return () => socket.disconnect();
  }, []);

  const notify = text => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2600);
  };

  const addNotification = (text, icon = "heart") => {
    setNotifications(old => [
      {
        id: `n${Date.now()}-${Math.random()}`,
        text,
        time: "Just now",
        read: false,
        icon
      },
      ...old
    ]);
  };

  const visiblePosts = useMemo(() => {
    return posts.filter(p => {
      const author = personById(p.author);
      const matches = `${author.name} ${author.handle} ${p.text}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const canSee =
        p.author === "me" ||
        p.privacy === "Public" ||
        friends.includes(p.author);

      return matches && canSee;
    });
  }, [posts, search, friends, people, profileName, profileBio, privacy]);

  const createPost = () => {
    if (!draft.trim() && !media) {
      return notify("Write something or add an image first.");
    }

    const post = {
      id: `p${Date.now()}`,
      author: "me",
      text: draft.trim(),
      image: media,
      time: "Just now",
      likes: [],
      comments: [],
      privacy
    };

    setPosts(old => [post, ...old]);
    setDraft("");
    setMedia("");

    socketRef.current?.emit("post:created", { post });
    notify("Your post has been shared.");
  };

  const toggleLike = post => {
    const liked = !post.likes.includes("me");

    setPosts(old =>
      old.map(p =>
        p.id === post.id
          ? {
              ...p,
              likes: liked
                ? [...p.likes, "me"]
                : p.likes.filter(id => id !== "me")
            }
          : p
      )
    );

    socketRef.current?.emit("post:liked", {
      postId: post.id,
      userId: "me",
      liked
    });

    if (liked && post.author !== "me") {
      addNotification(
        `You liked ${personById(post.author).name}'s post.`
      );
    }
  };

  const addComment = post => {
    const text = (commentDrafts[post.id] || "").trim();

    if (!text) return;

    const comment = {
      id: `c${Date.now()}`,
      author: "me",
      text
    };

    setPosts(old =>
      old.map(p =>
        p.id === post.id
          ? { ...p, comments: [...p.comments, comment] }
          : p
      )
    );

    setCommentDrafts(old => ({ ...old, [post.id]: "" }));

    socketRef.current?.emit("comment:created", {
      postId: post.id,
      comment
    });
  };

  const sendRequest = person => {
    if (friends.includes(person.id) || requests.includes(person.id)) {
      return;
    }

    setRequests(old => [...old, person.id]);

    socketRef.current?.emit("friend:request", {
      name: me.name,
      from: "me",
      to: person.id
    });

    addNotification(`Friend request sent to ${person.name}.`, "friend");
    notify(`Friend request sent to ${person.name}.`);
  };

  const acceptRequest = id => {
    setRequests(old => old.filter(x => x !== id));
    setFriends(old => [...new Set([...old, id])]);

    addNotification(
      `You are now connected with ${personById(id).name}.`,
      "friend"
    );
  };

  const markRead = id => {
    setNotifications(old =>
      old.map(n => n.id === id ? { ...n, read: true } : n)
    );

    socketRef.current?.emit("notification:read", { id });
  };

  const saveProfile = () => {
    const updatedPerson = {
      ...me,
      name: profileName,
      bio: profileBio,
      privacy
    };

    setPeople(old =>
      old.map(p => p.id === "me" ? updatedPerson : p)
    );

    socketRef.current?.emit("profile:updated", {
      person: updatedPerson
    });

    setProfileEditing(false);
    notify("Profile updated.");
  };

  const onFile = e => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return notify("Please choose an image file.");
    }

    if (file.size > 2 * 1024 * 1024) {
      return notify("Please use an image smaller than 2 MB.");
    }

    const reader = new FileReader();

    reader.onload = () => setMedia(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const postCard = (post, explore = false) => (
    <article className="post-card card" key={post.id}>
      <div className="post-header">
        <Avatar person={personById(post.author)} />

        <div className="post-author">
          <b>
            {personById(post.author).name}
            {post.author === "me" && <span className="you-badge">YOU</span>}
          </b>
          <span>
            {personById(post.author).role} · {post.time}
          </span>
        </div>

        <span className="post-privacy" title={`${post.privacy} post`}>
          {post.privacy === "Public"
            ? <Globe size={14} />
            : post.privacy === "Friends"
              ? <Users size={14} />
              : <Lock size={14} />}
        </span>

        {!explore && (
          <button
            className="icon-button more-button"
            aria-label="More options"
            onClick={() => notify("Post options are limited to this demo.")}
          >
            <MoreHorizontal size={20} />
          </button>
        )}
      </div>

      <p className="post-text">{post.text}</p>

      {post.image && (
        <img
          className="post-image"
          src={post.image}
          alt="Shared post media"
          loading="lazy"
        />
      )}

      <div className="post-metrics">
        <span>
          <span className="metric-heart">
            <Heart size={12} fill="currentColor" />
          </span>
          {post.likes.length} {post.likes.length === 1 ? "like" : "likes"}
        </span>

        <button
          onClick={() =>
            setCommentOpen(old => ({
              ...old,
              [post.id]: !old[post.id]
            }))
          }
        >
          {post.comments.length} comments
        </button>
      </div>

      <div className="post-actions">
        <button
          className={post.likes.includes("me") ? "liked" : ""}
          onClick={() => toggleLike(post)}
        >
          <Heart
            size={18}
            fill={post.likes.includes("me") ? "currentColor" : "none"}
          />
          <span>{post.likes.includes("me") ? "Liked" : "Like"}</span>
        </button>

        <button
          onClick={() =>
            setCommentOpen(old => ({
              ...old,
              [post.id]: !old[post.id]
            }))
          }
        >
          <MessageCircle size={18} />
          <span>Comment</span>
        </button>

        {!explore && (
          <button
            onClick={() => {
              if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(post.text)
                  .then(() => notify("Post text copied."))
                  .catch(() => notify("Could not copy post text."));
              } else {
                notify("Copy is not available in this browser.");
              }
            }}
          >
            <Send size={17} />
            <span>Share</span>
          </button>
        )}
      </div>

      {commentOpen[post.id] && (
        <div className="comments-area">
          {post.comments.map(comment => (
            <div className="comment" key={comment.id}>
              <Avatar person={personById(comment.author)} size="sm" />
              <div>
                <b>{personById(comment.author).name}</b>
                <p>{comment.text}</p>
              </div>
            </div>
          ))}

          <div className="comment-input">
            <Avatar person={me} size="sm" />

            <input
              value={commentDrafts[post.id] || ""}
              onChange={e =>
                setCommentDrafts(old => ({
                  ...old,
                  [post.id]: e.target.value
                }))
              }
              placeholder="Write a comment..."
              onKeyDown={e => {
                if (e.key === "Enter") addComment(post);
              }}
            />

            <button
              onClick={() => addComment(post)}
              aria-label="Send comment"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </article>
  );

  const pageTitle = {
    Home: "Your feed",
    Explore: "Explore",
    Friends: "Your people",
    Profile: "Your profile",
    Settings: "Settings",
    Saved: "Saved posts",
    Notifications: "Your notifications"
  };

  const pageDescription = {
    Home: "Catch up with the people and ideas you care about.",
    Explore: "Discover new people, fresh ideas, and public conversations.",
    Friends: "Manage your connections and friend requests.",
    Profile: "Share a little about yourself with your community.",
    Settings: "Control your privacy and preferences.",
    Saved: "Keep your favourite ideas close.",
    Notifications: "Updates from your community."
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setActive("Home")}>
          <span className="brand-mark"><Sparkles size={19} /></span>
          <span>orbit<span className="brand-dot">.</span></span>
        </button>

        <div className="top-search">
          <Search size={17} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search people and posts..."
          />
        </div>

        <div className="top-actions">
          <span className={`live-pill ${live ? "is-live" : ""}`}>
            <span className="live-dot" />
            {live ? "Live connected" : "Offline mode"}
          </span>

          <button
            className="icon-button notification-trigger"
            onClick={() => setShowNotifications(v => !v)}
            aria-label="Notifications"
          >
            <Bell size={19} />
            {unread > 0 && <i>{unread}</i>}
          </button>

          <button
            className="profile-chip"
            onClick={() => setActive("Profile")}
          >
            <Avatar person={me} size="sm" />
            <span>{profileName.split(" ")[0]}</span>
            <ChevronDown size={14} />
          </button>
        </div>

        {showNotifications && (
          <div className="notification-popover">
            <div className="popover-head">
              <b>Notifications</b>
              <button
                onClick={() => {
                  setNotifications(old =>
                    old.map(n => ({ ...n, read: true }))
                  );
                  setShowNotifications(false);
                }}
              >
                Mark all read
              </button>
            </div>

            {notifications.slice(0, 5).map(n => (
              <button
                className={`notification-item ${n.read ? "" : "unread"}`}
                key={n.id}
                onClick={() => markRead(n.id)}
              >
                <span className="notification-icon"><Bell size={15} /></span>
                <span>
                  {n.text}
                  <small>{n.time}</small>
                </span>
                {!n.read && <i />}
              </button>
            ))}

            {notifications.length === 0 && (
              <p className="empty-note">You're all caught up.</p>
            )}
          </div>
        )}
      </header>

      <div className="layout">
        <aside className="left-sidebar">
          <div className="sidebar-label">MENU</div>

          {[
            ["Home", Home],
            ["Explore", Compass],
            ["Notifications", Bell],
            ["Friends", Users],
            ["Profile", Users],
            ["Settings", Settings]
          ].map(([label, Icon]) => (
            <button
              key={label}
              className={`nav-item ${active === label ? "active" : ""}`}
              onClick={() => {
                setActive(label);
                if (label === "Notifications") setShowNotifications(true);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "Notifications" && unread > 0 && (
                <em>{unread}</em>
              )}
            </button>
          ))}

          <div className="sidebar-divider" />
          <div className="sidebar-label">YOUR SPACE</div>

          <button className="nav-item" onClick={() => setActive("Saved")}>
            <Bookmark size={18} />
            <span>Saved posts</span>
          </button>

          <button className="nav-item" onClick={() => setSettingsOpen(true)}>
            <Shield size={18} />
            <span>Privacy & safety</span>
          </button>

          <div className="sidebar-profile-card">
            <div className="sidebar-profile-top">
              <Avatar person={me} />
              <span className="online-dot" />
            </div>

            <b>{profileName}</b>
            <span>{me.handle}</span>

            <div className="mini-stats">
              <div>
                <b>{posts.filter(p => p.author === "me").length}</b>
                <small>Posts</small>
              </div>
              <div>
                <b>{friends.length}</b>
                <small>Friends</small>
              </div>
              <div>
                <b>
                  {posts
                    .filter(p => p.author === "me")
                    .reduce((sum, p) => sum + p.likes.length, 0)}
                </b>
                <small>Likes</small>
              </div>
            </div>

            <button className="text-button" onClick={() => setActive("Profile")}>
              View profile <span>→</span>
            </button>
          </div>

          <div className="sidebar-footer">
            Made for meaningful connections <span>✦</span>
            <small>© 2026 Orbit Social</small>
          </div>
        </aside>

        <main className="main-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span /> YOUR COMMUNITY, YOUR SPACE
              </div>
              <h1>{pageTitle[active] || "Your community"}</h1>
              <p>{pageDescription[active] || "Stay connected to your community."}</p>
            </div>
            <div className="date-pill">
              <Activity size={15} /> Community is active
            </div>
          </div>

          {/* HOME PAGE */}
          {active === "Home" && (
            <>
              <section className="welcome-banner">
                <div className="banner-orb orb-one" />
                <div className="banner-orb orb-two" />

                <div className="banner-content">
                  <div className="banner-kicker">
                    <Sparkles size={14} /> A LITTLE SPACE TO BE YOU
                  </div>

                  <h2>
                    Good things happen<br />
                    when we <span>connect.</span>
                  </h2>

                  <p>
                    Share your thoughts, celebrate small wins, and find your people.
                  </p>

                  <button
                    onClick={() =>
                      document.getElementById("post-composer")
                        ?.scrollIntoView({ behavior: "smooth", block: "center" })
                    }
                  >
                    Create a post <Plus size={16} />
                  </button>
                </div>

                <div className="banner-art">
                  <div className="art-ring ring-one" />
                  <div className="art-ring ring-two" />
                  <div className="art-star star-one">✦</div>
                  <div className="art-star star-two">✧</div>
                  <div className="art-center"><Users size={37} /></div>
                  <div className="art-person person-one">MC</div>
                  <div className="art-person person-two">NA</div>
                  <div className="art-person person-three">AM</div>
                </div>
              </section>

              <section className="stories-section">
                <div className="section-heading">
                  <div>
                    <h3>People to know</h3>
                    <p>New perspectives are one hello away.</p>
                  </div>
                  <button className="subtle-link" onClick={() => setActive("Friends")}>
                    See all <span>→</span>
                  </button>
                </div>

                <div className="people-row">
                  {people.filter(p => p.id !== "me").map(person => (
                    <article className="person-card" key={person.id}>
                      <div className={`person-cover ${person.color}`}>
                        <div className="cover-shine" />
                        <Avatar person={person} size="lg" />
                      </div>

                      <div className="person-info">
                        <b>{person.name}</b>
                        <span>{person.role}</span>

                        <button
                          className={
                            friends.includes(person.id)
                              ? "connected-button"
                              : requests.includes(person.id)
                                ? "requested-button"
                                : "connect-button"
                          }
                          onClick={() =>
                            friends.includes(person.id)
                              ? notify("You are already connected.")
                              : requests.includes(person.id)
                                ? notify("Request already sent.")
                                : sendRequest(person)
                          }
                        >
                          {friends.includes(person.id)
                            ? <><Check size={14} /> Connected</>
                            : requests.includes(person.id)
                              ? "Requested"
                              : <><UserPlus size={14} /> Add friend</>}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="composer card" id="post-composer">
                <div className="composer-top">
                  <Avatar person={me} />
                  <div className="composer-input">
                    <textarea
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      placeholder={`What's on your mind, ${profileName.split(" ")[0]}?`}
                      rows={2}
                    />
                  </div>
                </div>

                {media && (
                  <div className="media-preview">
                    <img src={media} alt="Selected upload" />
                    <button onClick={() => setMedia("")} aria-label="Remove image">
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="composer-bottom">
                  <div className="composer-tools">
                    <button onClick={() => fileRef.current?.click()}>
                      <ImageIcon size={17} /> Photo
                    </button>

                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={onFile}
                    />

                    <span className="composer-divider" />

                    <label className="privacy-select">
                      <Globe size={15} />
                      <select
                        value={privacy}
                        onChange={e => setPrivacy(e.target.value)}
                        aria-label="Post privacy"
                      >
                        <option>Public</option>
                        <option>Friends</option>
                        <option>Only me</option>
                      </select>
                      <ChevronDown size={12} />
                    </label>
                  </div>

                  <button className="primary-button" onClick={createPost}>
                    Share post <Send size={15} />
                  </button>
                </div>
              </section>

              <div className="feed-title">
                <div>
                  <h3>Latest posts</h3>
                  <p>Conversations from your community</p>
                </div>
                <span className="sort-button">
                  <Activity size={14} /> Recent
                </span>
              </div>

              <div className="feed-list">
                {visiblePosts.map(post => postCard(post))}

                {visiblePosts.length === 0 && (
                  <div className="empty-state">
                    <div><Search size={24} /></div>
                    <h3>No posts found</h3>
                    <p>Try another search or be the first to share something.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* SEPARATE EXPLORE PAGE */}
          {active === "Explore" && (
            <div className="explore-page">
              <section className="content-panel card">
                <div className="panel-title">
                  <div>
                    <h3>Discover your community</h3>
                    <p>Find people and conversations that inspire you.</p>
                  </div>
                  <Compass size={22} />
                </div>

                <div className="explore-search">
                  <Search size={17} />
                  <input
                    value={exploreSearch}
                    onChange={e => setExploreSearch(e.target.value)}
                    placeholder="Search people and public posts..."
                  />
                  {exploreSearch && (
                    <button
                      onClick={() => setExploreSearch("")}
                      aria-label="Clear explore search"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <h4 className="list-heading">People you may know</h4>

                <div className="people-row">
                  {people
                    .filter(person =>
                      person.id !== "me" &&
                      `${person.name} ${person.role} ${person.bio}`
                        .toLowerCase()
                        .includes(exploreSearch.toLowerCase())
                    )
                    .map(person => (
                      <article className="person-card" key={person.id}>
                        <div className={`person-cover ${person.color}`}>
                          <div className="cover-shine" />
                          <Avatar person={person} size="lg" />
                        </div>

                        <div className="person-info">
                          <b>{person.name}</b>
                          <span>{person.role}</span>
                          <p>{person.bio}</p>

                          <button
                            className={
                              friends.includes(person.id)
                                ? "connected-button"
                                : requests.includes(person.id)
                                  ? "requested-button"
                                  : "connect-button"
                            }
                            onClick={() =>
                              friends.includes(person.id)
                                ? notify("You are already connected.")
                                : requests.includes(person.id)
                                  ? notify("Request already sent.")
                                  : sendRequest(person)
                            }
                          >
                            {friends.includes(person.id)
                              ? <><Check size={14} /> Connected</>
                              : requests.includes(person.id)
                                ? "Requested"
                                : <><UserPlus size={14} /> Add friend</>}
                          </button>
                        </div>
                      </article>
                    ))}
                </div>

                <h4 className="list-heading">Trending topics</h4>

                <div className="explore-topics">
                  {[
                    ["#BuildInPublic", "Share your projects and progress"],
                    ["#DesignThinking", "Ideas for better experiences"],
                    ["#LearnTogether", "Learn something new together"],
                    ["#TechForGood", "Technology that makes a difference"]
                  ].map(([topic, description]) => (
                    <button
                      className="trend-row"
                      key={topic}
                      onClick={() => setExploreSearch(topic.replace("#", ""))}
                    >
                      <span>
                        <b>{topic}</b>
                        <small>{description}</small>
                      </span>
                      <Search size={16} />
                    </button>
                  ))}
                </div>
              </section>

              <div className="feed-title">
                <div>
                  <h3>Discover public posts</h3>
                  <p>Explore ideas shared with the community.</p>
                </div>
                <span className="sort-button">
                  <Globe size={14} /> Public posts
                </span>
              </div>

              <div className="feed-list">
                {visiblePosts
                  .filter(post =>
                    post.privacy === "Public" &&
                    `${personById(post.author).name} ${personById(post.author).handle} ${post.text}`
                      .toLowerCase()
                      .includes(exploreSearch.toLowerCase())
                  )
                  .map(post => postCard(post, true))}

                {visiblePosts.filter(post =>
                  post.privacy === "Public" &&
                  `${personById(post.author).name} ${personById(post.author).handle} ${post.text}`
                    .toLowerCase()
                    .includes(exploreSearch.toLowerCase())
                ).length === 0 && (
                  <div className="empty-state">
                    <div><Search size={24} /></div>
                    <h3>No public posts found</h3>
                    <p>Try a different search term.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FRIENDS PAGE */}
          {active === "Friends" && (
            <section className="content-panel card">
              <div className="panel-title">
                <div>
                  <h3>People in your orbit</h3>
                  <p>Manage your connections and requests.</p>
                </div>
                <Users size={20} />
              </div>

              <h4 className="list-heading">
                Friend requests <span>{requests.length}</span>
              </h4>

              {requests.map(id => (
                <div className="friend-row" key={id}>
                  <Avatar person={personById(id)} />
                  <div className="friend-details">
                    <b>{personById(id).name}</b>
                    <span>{personById(id).role}</span>
                  </div>
                  <button className="primary-button" onClick={() => acceptRequest(id)}>
                    <Check size={15} /> Accept
                  </button>
                </div>
              ))}

              {requests.length === 0 && (
                <p className="empty-note">No pending requests.</p>
              )}

              <h4 className="list-heading">
                Your friends <span>{friends.length}</span>
              </h4>

              {friends.map(id => (
                <div className="friend-row" key={id}>
                  <Avatar person={personById(id)} />
                  <div className="friend-details">
                    <b>{personById(id).name}</b>
                    <span>{personById(id).role}</span>
                  </div>
                  <span className="connected-label">
                    <span /> Connected
                  </span>
                </div>
              ))}

              {people
                .filter(p =>
                  p.id !== "me" &&
                  !friends.includes(p.id) &&
                  !requests.includes(p.id)
                )
                .map(person => (
                  <div className="friend-row" key={person.id}>
                    <Avatar person={person} />
                    <div className="friend-details">
                      <b>{person.name}</b>
                      <span>{person.role}</span>
                    </div>
                    <button className="outline-button" onClick={() => sendRequest(person)}>
                      <UserPlus size={15} /> Add friend
                    </button>
                  </div>
                ))}
            </section>
          )}

          {/* PROFILE PAGE */}
          {active === "Profile" && (
            <section className="profile-page card">
              <div className="profile-cover">
                <div className="cover-shine" />
                <div className="profile-avatar-wrap">
                  <Avatar person={me} size="xl" />
                </div>

                <button
                  className="edit-profile-button"
                  onClick={() => setProfileEditing(v => !v)}
                >
                  {profileEditing ? <X size={15} /> : <Settings size={15} />}
                  {profileEditing ? "Cancel" : "Edit profile"}
                </button>
              </div>

              <div className="profile-body">
                <h2>{profileName}</h2>
                <span className="profile-handle">{me.handle} · {me.role}</span>

                {profileEditing ? (
                  <div className="edit-form">
                    <label>
                      Display name
                      <input
                        value={profileName}
                        onChange={e => setProfileName(e.target.value)}
                      />
                    </label>

                    <label>
                      Bio
                      <textarea
                        value={profileBio}
                        onChange={e => setProfileBio(e.target.value)}
                        rows={3}
                      />
                    </label>

                    <button className="primary-button" onClick={saveProfile}>
                      Save changes <Check size={15} />
                    </button>
                  </div>
                ) : (
                  <p className="profile-bio">{profileBio}</p>
                )}

                <div className="profile-stats">
                  <div>
                    <b>{posts.filter(p => p.author === "me").length}</b>
                    <span>Posts</span>
                  </div>
                  <div>
                    <b>{friends.length}</b>
                    <span>Friends</span>
                  </div>
                  <div>
                    <b>
                      {posts
                        .filter(p => p.author === "me")
                        .reduce((sum, p) => sum + p.likes.length, 0)}
                    </b>
                    <span>Likes received</span>
                  </div>
                </div>

                <div className="profile-posts">
                  <h3>Your posts</h3>

                  {posts.filter(p => p.author === "me").map(post => (
                    <div className="profile-post-row" key={post.id}>
                      <div>
                        <b>{post.text || "Shared an image"}</b>
                        <span>{post.time} · {post.privacy}</span>
                      </div>
                      <span><Heart size={14} /> {post.likes.length}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* NOTIFICATIONS PAGE */}
          {active === "Notifications" && (
            <section className="content-panel card">
              <div className="panel-title">
                <div>
                  <h3>Notifications</h3>
                  <p>Updates from your community.</p>
                </div>
                <Bell size={20} />
              </div>

              {notifications.map(n => (
                <button
                  className={`notification-item full ${n.read ? "" : "unread"}`}
                  key={n.id}
                  onClick={() => markRead(n.id)}
                >
                  <span className="notification-icon"><Bell size={15} /></span>
                  <span>
                    {n.text}
                    <small>{n.time}</small>
                  </span>
                  {!n.read && <i />}
                </button>
              ))}
            </section>
          )}

          {/* SAVED POSTS PAGE */}
          {active === "Saved" && (
            <section className="content-panel card">
              <div className="panel-title">
                <div>
                  <h3>Saved posts</h3>
                  <p>Your bookmarked inspiration.</p>
                </div>
                <Bookmark size={20} />
              </div>

              <div className="empty-state">
                <div><Bookmark size={24} /></div>
                <h3>Your saved space is ready</h3>
                <p>Bookmark functionality can be connected to individual posts.</p>
              </div>
            </section>
          )}

          {/* SETTINGS PAGE */}
          {(active === "Settings" || settingsOpen) && (
            <section className="content-panel card">
              <div className="panel-title">
                <div>
                  <h3>Privacy & settings</h3>
                  <p>You decide what you share and who can see it.</p>
                </div>
                <Shield size={20} />
              </div>

              <div className="setting-row">
                <div className="setting-icon"><Lock size={18} /></div>
                <div className="setting-copy">
                  <b>Default post audience</b>
                  <span>Choose who can see new posts you create.</span>
                </div>
                <select
                  value={privacy}
                  onChange={e => setPrivacy(e.target.value)}
                >
                  <option>Public</option>
                  <option>Friends</option>
                  <option>Only me</option>
                </select>
              </div>

              <div className="setting-row">
                <div className="setting-icon"><Bell size={18} /></div>
                <div className="setting-copy">
                  <b>Notifications</b>
                  <span>Mark all current notifications as read.</span>
                </div>
                <button
                  className="outline-button"
                  onClick={() =>
                    setNotifications(old => old.map(n => ({ ...n, read: true })))
                  }
                >
                  Mark read
                </button>
              </div>

              <div className="setting-row">
                <div className="setting-icon"><Shield size={18} /></div>
                <div className="setting-copy">
                  <b>Local data</b>
                  <span>Your demo posts and settings are saved in this browser.</span>
                </div>
                <button
                  className="outline-button danger"
                  onClick={() => {
                    if (window.confirm("Clear locally saved Orbit data? This cannot be undone.")) {
                      [
                        "orbit-people",
                        "orbit-posts",
                        "orbit-notifications",
                        "orbit-requests",
                        "orbit-friends",
                        "orbit-privacy"
                      ].forEach(k => localStorage.removeItem(k));

                      window.location.reload();
                    }
                  }}
                >
                  Reset demo
                </button>
              </div>

              <p className="privacy-note">
                <Lock size={14} />
                This is a portfolio demo, not a production account system. Do not post sensitive information.
              </p>
            </section>
          )}

          <footer className="main-footer">
            <span>orbit<span className="brand-dot">.</span></span>
            <span>Built for connection, powered by curiosity.</span>
            <span>Privacy · Community · About</span>
          </footer>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="right-sidebar">
          <section className="side-widget">
            <div className="widget-heading">
              <h3>Friend requests</h3>
              <button onClick={() => setActive("Friends")}>View all</button>
            </div>

            {requests.slice(0, 2).map(id => (
              <div className="request-mini" key={id}>
                <Avatar person={personById(id)} size="sm" />
                <div>
                  <b>{personById(id).name}</b>
                  <span>Wants to connect</span>
                  <div className="request-actions">
                    <button onClick={() => acceptRequest(id)}>
                      <Check size={13} /> Accept
                    </button>
                    <button onClick={() => setRequests(old => old.filter(x => x !== id))}>
                      Ignore
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {requests.length === 0 && (
              <p className="empty-note">No new requests.</p>
            )}
          </section>

          <section className="side-widget">
            <div className="widget-heading">
              <h3>Trending topics</h3>
              <Compass size={16} />
            </div>

            {[
              ["#BuildInPublic", "1.2k posts"],
              ["#DesignThinking", "856 posts"],
              ["#LearnTogether", "642 posts"],
              ["#TechForGood", "431 posts"]
            ].map(([topic, count]) => (
              <button
                className="trend-row"
                key={topic}
                onClick={() => {
                  setExploreSearch(topic.replace("#", ""));
                  setActive("Explore");
                }}
              >
                <span>
                  <b>{topic}</b>
                  <small>{count}</small>
                </span>
                <MoreHorizontal size={17} />
              </button>
            ))}
          </section>

          <section className="side-widget community-widget">
            <div className="community-icon"><Sparkles size={20} /></div>
            <h3>Make your corner count.</h3>
            <p>
              Every thoughtful comment and kind connection makes this community better.
            </p>
            <button onClick={() => setActive("Explore")}>
              Explore community <span>→</span>
            </button>
          </section>

          <div className="online-widget">
            <span className={live ? "online-live" : ""} />
            <div>
              <b>{live ? "Real-time is on" : "Demo mode"}</b>
              <small>
                {live
                  ? "Socket connection active"
                  : "Start the server to enable live updates"}
              </small>
            </div>
            <Radio size={17} />
          </div>
        </aside>
      </div>

      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
          <button onClick={() => setToast("")}><X size={14} /></button>
        </div>
      )}

      {settingsOpen && active !== "Settings" && (
        <div
          className="modal-backdrop"
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="settings-modal card"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSettingsOpen(false)}
            >
              <X size={18} />
            </button>

            <h2>Privacy & safety</h2>
            <p>Manage the audience for your posts and your local demo data.</p>

            <div className="setting-row">
              <div className="setting-icon"><Lock size={18} /></div>
              <div className="setting-copy">
                <b>Default post audience</b>
                <span>Who can see new posts?</span>
              </div>
              <select
                value={privacy}
                onChange={e => setPrivacy(e.target.value)}
              >
                <option>Public</option>
                <option>Friends</option>
                <option>Only me</option>
              </select>
            </div>

            <button
              className="primary-button modal-done"
              onClick={() => setSettingsOpen(false)}
            >
              Done <Check size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
