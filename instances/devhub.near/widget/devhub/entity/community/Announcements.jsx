const { handle } = props;
const { getCommunity, setCommunitySocialDB } = VM.require(
  "${REPL_DEVHUB}/widget/core.adapter.devhub-contract"
);

getCommunity = getCommunity || (() => <></>);
setCommunitySocialDB = setCommunitySocialDB || (() => <></>);

const communityData = getCommunity({ handle });
const [postsExists, setPostExists] = useState(false);
const [newUnseenPosts, setNewUnseenPosts] = useState([]);
const [lastQueryRequestTimestamp, setLastQueryRequestTimestamp] = useState(
  new Date().getTime()
);
const [submittedAnnouncementData, setSubmittedAnnouncementData] =
  useState(null);
const communityAccountId = `${handle}.community.${REPL_DEVHUB_CONTRACT}`;

let checkIndexerInterval;
const onNewUnseenPosts = (newUnseenPosts) => {
  if (newUnseenPosts.length > 0) {
    clearInterval(checkIndexerInterval);
  }
};

useEffect(() => {
  if (submittedAnnouncementData) {
    const checkForAnnouncementInSocialDB = () => {
      Near.asyncView("${REPL_SOCIAL_CONTRACT}", "get", {
        keys: [`${communityAccountId}/post/**`],
      }).then((result) => {
        try {
          const submittedAnnouncementText = JSON.parse(
            submittedAnnouncementData.post.main
          ).text;
          const lastAnnouncementTextFromSocialDB = JSON.parse(
            result[communityAccountId].post.main
          ).text;
          if (submittedAnnouncementText === lastAnnouncementTextFromSocialDB) {
            setSubmittedAnnouncementData(null);
            checkIndexerInterval = setInterval(() => {
              setLastQueryRequestTimestamp(new Date().getTime());
            }, 500);
            return;
          }
        } catch (e) {}
        setTimeout(() => checkForAnnouncementInSocialDB(), 1000);
      });
    };
    checkForAnnouncementInSocialDB();
  }
}, [submittedAnnouncementData]);

const MainContent = styled.div`
  padding-left: 2rem;
  flex: 3;
  @media screen and (max-width: 960px) {
    padding-left: 0rem;
  }
  .post:hover {
    background-color: inherit !important;
  }
`;

const SidebarContainer = styled.div`
  flex: 1;
`;

const Heading = styled.div`
  font-size: 19px;
  font-weight: 600;
`;

const SubHeading = styled.div`
  font-size: 15px;
  font-weight: 600;
`;

const Container = styled.div`
  flex-wrap: no-wrap;
  max-width: 100%;

  .max-width-100 {
    max-width: 100%;
  }
  @media screen and (max-width: 960px) {
    flex-wrap: wrap;
  }

  .card {
    border-radius: 1rem !important;
  }

  .display-none {
    display: none;
  }
`;

const Tag = styled.div`
  border-top-right-radius: 50px;
  border-bottom-right-radius: 50px;
  border-top-left-radius: 50px;
  border-bottom-left-radius: 50px;
  padding-inline: 0.8rem;
  padding-block: 0.3rem;
  display: flex;
  gap: 0.5rem;
  border-width: 1px;
  border-style: solid;
  font-size: 14px;
  color: rgba(0, 236, 151, 1);
  font-weight: 800;
`;

const [sort, setSort] = useState("desc");

return (
  <div className="w-100" style={{ maxWidth: "100%" }}>
    <Container className="d-flex gap-3 m-3 pl-2">
      <MainContent className="max-width-100">
        <div className="d-flex flex-column gap-4">
          {context.accountId &&
            (communityData?.admins ?? []).includes(context.accountId) && (
              <div className="card p-4">
                <Widget
                  src={"${REPL_DEVHUB}/widget/devhub.entity.community.Compose"}
                  props={{
                    onSubmit: (v) => {
                      setSubmittedAnnouncementData(v);
                      setCommunitySocialDB({ handle, data: v });
                    },
                    profileAccountId: `${handle}.community.${REPL_DEVHUB_CONTRACT}`,
                    isFinished: () => submittedAnnouncementData === null,
                  }}
                />
              </div>
            )}
          <div className="d-flex flex-wrap justify-content-between">
            <Heading>Announcements</Heading>
            <div
              className={
                postsExists
                  ? "d-flex align-items-center gap-2"
                  : " display-none"
              }
            >
              <select
                name="sort"
                id="sort"
                class="form-select"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                }}
              >
                <option selected value="desc">
                  Latest
                </option>
                <option value="recentcommentdesc">Last Commented</option>
              </select>
            </div>
          </div>
          {!postsExists && (
            <div>
              <h6>No announcements exists.</h6>
            </div>
          )}
          <div className={postsExists && "card p-4"}>
            <Widget
              src="${REPL_DEVHUB}/widget/devhub.components.organism.Feed"
              props={{
                handle: props.handle,
                tab: "announcements",
                page: "community",
                highlight: props.highlight,
                filteredAccountIds: [communityAccountId],
                sort: sort,
                setPostExists: setPostExists,
                showFlagAccountFeature: true,
                lastQueryRequestTimestamp,
                onNewUnseenPosts,
              }}
            />
          </div>
        </div>
      </MainContent>
      <SidebarContainer>
        <div className="d-flex flex-column gap-3">
          <div className="card p-4">
            <div className="mb-2">{communityData?.description}</div>
            <div className="d-flex gap-2 flex-wrap">
              <Tag>{communityData?.tag} </Tag>
            </div>
          </div>
          <div className="card p-4 d-flex flex-column gap-2">
            <SubHeading>Community Admins</SubHeading>
            {(communityData?.admins ?? []).map((accountId) => (
              <div
                key={accountId}
                className="d-flex"
                style={{ fontWeight: 500 }}
              >
                <Widget
                  src="${REPL_DEVHUB}/widget/devhub.components.molecule.ProfileCard"
                  props={{ accountId }}
                />
              </div>
            ))}
          </div>
        </div>
      </SidebarContainer>
    </Container>
  </div>
);
