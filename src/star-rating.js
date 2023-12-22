export default class StarRating extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.showNumbers = true;
    this.starCount = 5;
    this.rating = 0;
    this.lastSetRating = 0;
    this.activeColor = "#e70911";
    this.size = "1em";
    this.readonly = false;
  }

  static get observedAttributes() {
    return ["data-rating"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "data-rating") {
      this.rating = this.lastSetRating = parseFloat(newValue);

      if (!this.shadowRoot.innerHTML) this.render();

      this.updateStarRatingWidth();

      const ratingDisplay = this.shadowRoot.querySelector(".rating-display");
      if (this.showNumbers && ratingDisplay) {
        ratingDisplay.textContent = this.rating.toFixed(1);
      }
    }
  }

  connectedCallback() {
    if (this.hasAttribute("data-rating")) {
      this.rating = this.lastSetRating = parseFloat(this.getAttribute("data-rating"));
    }

    if (this.hasAttribute("data-active-color")) {
      this.activeColor = this.getAttribute("data-active-color");
    }

    if (this.hasAttribute("data-size")) {
      this.size = this.getAttribute("data-size");

      let sizeNumber = Number.parseInt(this.size);
      let sizeUnit = this.size.split(sizeNumber + "")[1];
      this.fontSize = Math.max(1, sizeNumber - 0.5) + sizeUnit;
    }

    if (this.hasAttribute("data-showNumbers")) {
      this.showNumbers = this.getAttribute("data-showNumbers") == "true";
    }

    if (this.hasAttribute("readonly")) {
      this.readonly = true;
    }

    this.render();
    this.updateStarRatingWidth();
    if (!this.readonly) this.addEventListeners();
  }

  render() {
    const ratingDisplay = this.showNumbers
      ? `<span class="rating-display">${this.lastSetRating.toFixed(1)}</span>`
      : "";
    this.shadow.innerHTML = `
      <style>
          :host {
              --star-size: ${this.size}; 
              font-size: var(--star-size);
              display: inline-block;
              unicode-bidi: bidi-override;
          }
          .star-rating {
              unicode-bidi: bidi-override;
              display: inline-flex; 
              align-items: baseline; 
              position: relative;
              font-size: var(--star-size); 
              /* padding-right: 3em; */
          }

          .back-stars {
              color: #ddd;
              display: inline-block;
              position: relative; 
              /* width: calc(5 * ${this.size}); */
              z-index: 1;
              cursor: pointer;
          }
          .front-stars {
              color: ${this.activeColor};
              display: inline-block;
              position: absolute;
              top: 0;
              left: 0;
              white-space: nowrap; 
              overflow: hidden;
              width: 0; 
              z-index: 2; 
              color: ${this.activeColor}; 
          }
          .rating-display {
              display: inline-block;
              margin-left: 0.5em; 
              font-size: ${this.fontSize}; 
              position: relative; 
              z-index: 3; 
          }
      </style>
      <div class="star-rating">
          <div class="back-stars">
              ${"★".repeat(this.starCount)}
              <div class="front-stars">
                  ${"★".repeat(this.starCount)}
              </div>
          </div>
          ${ratingDisplay}
      </div>
     
    `;
  }
  addEventListeners() {
    if (this.readonly) return;
    const backStars = this.shadow.querySelector(".back-stars");
    backStars.addEventListener("mousemove", this.updateRating.bind(this));
    backStars.addEventListener("mouseleave", this.restoreRating.bind(this));
    backStars.addEventListener("click", this.setRating.bind(this));

    // mobile対応
    this.addEventListener("touchstart", (event) => event.stopPropagation());
    this.addEventListener("touchmove", (event) => event.stopPropagation());
    this.addEventListener("touchend", (event) => this.handleRating(event));
  }

  updateRating(e) {
    this.rating = this.calculateRating(e);
    this.shadow.querySelector(".front-stars").style.width = `${(this.rating / this.starCount) * 100}%`;
    if (this.showNumbers) this.shadow.querySelector(".rating-display").textContent = this.rating.toFixed(1);
  }

  restoreRating() {
    // using lastSetRating to restore the display of stars
    const frontStars = this.shadowRoot.querySelector(".front-stars");
    frontStars.style.width = `${(this.lastSetRating / this.starCount) * 100}%`;

    const ratingDisplay = this.shadowRoot.querySelector(".rating-display");
    if (ratingDisplay) ratingDisplay.textContent = this.lastSetRating.toFixed(1);
  }

  setRating(e) {
    e.stopPropagation();
    this.rating = this.lastSetRating = this.calculateRating(e);
    this.updateStarRatingWidth();

    const ratingDisplay = this.shadowRoot.querySelector(".rating-display");
    if (ratingDisplay) ratingDisplay.textContent = this.lastSetRating.toFixed(1);

    this.dispatchEvent(new CustomEvent("rate", { detail: { rating: this.lastSetRating } }));
  }

  calculateRating(e) {
    const bounds = this.shadowRoot.querySelector(".back-stars").getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const rating = (x / bounds.width) * this.starCount;
    return Math.round(rating * 10) / 10; // rounding
  }

  updateStarRatingWidth() {
    const frontStars = this.shadowRoot.querySelector(".front-stars");
    if (frontStars) frontStars.style.width = `${(this.lastSetRating / this.starCount) * 100}%`;
  }

  // Call from outside, changing scores
  setRatingFromOutside(newRating) {
    // Make sure the score is within a reasonable range
    this.rating = this.lastSetRating = Math.min(Math.max(newRating, 0), this.starCount);
    this.shadow.querySelector(".front-stars").style.width = `${(this.rating / this.starCount) * 100}%`;
  }
}

customElements.define("star-rating", StarRating);
