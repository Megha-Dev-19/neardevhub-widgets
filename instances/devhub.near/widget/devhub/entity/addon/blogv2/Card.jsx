function Card({ data, addonParameters }) {
  const { category, title, description, publishedAt: date, id } = data;
  const { categoriesEnabled, categories } = addonParameters;

  let categoryIsOptionInSettings = true;
  let categoriesInSettings = (categories || []).map((c) => c.value);
  if (
    categoriesInSettings.length > 0 &&
    !categoriesInSettings.includes(category) &&
    category !== "" &&
    category !== null
  ) {
    categoryIsOptionInSettings = false;
  }

  const Container = styled.div`
    min-height: 12.5rem;
    height: 100%;
    display: flex;
    padding: 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    flex-shrink: 0;

    border-radius: 1rem;
    border: 1px solid rgba(129, 129, 129, 0.3);
    background: #fffefe;

    h5 {
      margin: 0;
      color: #151515;
      font-size: 1.5rem;
      font-style: normal;
      font-weight: 700;
      line-height: 110%; /* 39.6px */
    }

    span.news {
      color: #f40303;
    }

    span.reference {
      color: #ff7a00;
    }

    span.guide {
      color: #004be1;
    }

    span.category {
      font-size: 1rem;
      font-style: normal;
      font-weight: 700;
      line-height: 20px; /* 125% */
      text-transform: uppercase;
    }

    span.date {
      color: #818181;
      font-size: 16px;
      font-style: normal;
      font-weight: 400;
      line-height: 20px; /* 125% */
      margin-top: auto;
    }

    p {
      margin: 0;
      color: #151515;
      font-size: 1rem;
      font-style: normal;
      font-weight: 400;
      line-height: 120%; /* 28.8px */
    }
  `;

  const options = { year: "numeric", month: "short", day: "numeric" };
  const formattedDate = new Date(date).toLocaleString("en-US", options);

  return (
    <Container id={`blog-card-${id}`} data-testid={id}>
      {category &&
        categoriesEnabled === "enabled" &&
        categoryIsOptionInSettings && (
          <span
            className={`category ${category && category.toLowerCase()}`}
            data-testid="card-category"
          >
            {category}
          </span>
        )}
      <h5 data-testid="blog-card-title">{title}</h5>
      <p>{description}</p>
      <span className="date" data-testid="blog-card-date">
        {formattedDate}
      </span>
    </Container>
  );
}

return { Card };
