const title = props.title;
const links = props.links;
const href = props.href;

const [showMenu, setShowMenu] = useState(false);

const { href: linkHref } = VM.require(`${REPL_DEVHUB}/widget/core.lib.url`);

linkHref || (linkHref = () => {});

const Dropdown = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;

  p {
    &.active {
      color: #fff;

      &:hover {
        text-decoration: none;
        color: #096d50 !important;
      }
    }
  }
`;

const DropdownMenu = styled.div`
  z-index: 50;
  position: absolute;
  top: 2.25rem;

  &.active {
    padding: 0.5rem 1rem;
    padding-top: 1rem;
    border-radius: 1rem;
    background: rgba(217, 217, 217, 0.7);
    backdrop-filter: blur(5px);
    width: max-content;
    animation: slide-down 300ms ease;
    transform-origin: top center;
  }

  @keyframes slide-down {
    0% {
      transform: scaleY(0);
    }
    100% {
      transform: scaleY(1);
    }
  }
`;

const DropdownLink = styled.div`
  color: inherit;
  text-decoration: none;

  &.active {
    color: #555555;
  }

  &:hover {
    text-decoration: none;
    color: #096d50 !important;
  }
`;

return (
  <Dropdown
    onMouseEnter={() => setShowMenu(true)}
    onMouseLeave={() => setShowMenu(false)}
  >
    {href ? (
      <DropdownLink className={href === props.page && "active"} href={href}>
        <Link
          style={{ textDecoration: "none" }}
          to={linkHref({
            widgetSrc: `${REPL_TREASURY_TEMPLAR}/widget/portal`,
            params: { page: href },
          })}
        >
          {title}
        </Link>
      </DropdownLink>
    ) : (
      <p className={`m-0 py-2 nav-dropdown`} style={{ cursor: "default" }}>
        {title} ↓
      </p>
    )}
    {showMenu && links.length !== 0 && (
      <DropdownMenu className={`${showMenu && "active"}`}>
        <div className="d-flex flex-column gap-3">
          {links.map((link) => (
            // Check if the link is external
            <DropdownLink
              className={link.href === props.page && "active"}
              key={`${link.title}-${link.href}`}
            >
              {link.href.startsWith("http://") ||
              link.href.startsWith("https://") ? (
                // External link: Render an <a> tag
                <a
                  href={link.href}
                  style={{ textDecoration: "none" }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.title}
                </a>
              ) : (
                // Internal link: Render the <Link> component
                <Link
                  style={{ textDecoration: "none" }}
                  to={linkHref({
                    widgetSrc: `${REPL_TREASURY_TEMPLAR}/widget/portal`,
                    params: { page: link.href },
                  })}
                >
                  {link.title}
                </Link>
              )}
            </DropdownLink>
          ))}
        </div>
      </DropdownMenu>
    )}
  </Dropdown>
);
