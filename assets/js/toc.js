document.addEventListener('DOMContentLoaded', function () {
  const tocList = document.getElementById('toc');
  const tocContainer = document.getElementById('toc-container');
  const postContent = document.querySelector('.post-content');

  if (!tocList || !postContent || !tocContainer) {
    if (tocContainer) {
      tocContainer.style.display = 'none'; // Hide container if essential elements are missing
    }
    return;
  }

  const headings = postContent.querySelectorAll('h2, h3');
  let foundHeadings = false;

  headings.forEach(function (heading, index) {
    foundHeadings = true;
    let id = heading.id;
    if (!id) {
      // Create a sanitized ID from the heading text
      id = 'heading-' + index + '-' + heading.textContent.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
      heading.id = id;
    }

    const listItem = document.createElement('li');
    const link = document.createElement('a');

    link.href = '#' + id;
    link.textContent = heading.textContent;

    if (heading.tagName === 'H3') {
      listItem.classList.add('toc-level-2');
    }

    listItem.appendChild(link);
    tocList.appendChild(listItem);
  });

  if (!foundHeadings) {
    tocContainer.style.display = 'none'; // Hide ToC if no h2 or h3 headings are found
  }
});
