import { CATEGORIES } from './du-lieu-danh-muc';

type HeroSectionProps = {
  category: string;
  setCategory: (cat: string) => void;
};

export function HeroSection({ category, setCategory }: HeroSectionProps) {
  return (
    <>
      {/* 2. Hero Section */}
      <section className="hero-card">
        <img
          src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=85"
          alt="Cà phê ngon"
          className="hero-img-bg"
        />
        <div className="hero-gradient" />
        <div className="hero-content">
          <div className="hero-pill">🌱 BrewLite · Good Coffee, Better Day</div>
          <h1 className="hero-title">
            Cà phê ngon
            <br />
            Cho ngày thêm trọn vẹn
          </h1>
          <p className="hero-desc">
            Hương vị tinh tế, nguyên liệu chất lượng và không gian ấm cúng.
          </p>
          <a
            href="#menu"
            className="btn-hero"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Khám phá menu →
          </a>
        </div>
      </section>

      {/* 3. Category Quick Circles */}
      <section className="category-circles">
        {CATEGORIES.filter((c) => c.id !== 'Tất cả').map((cat) => (
          <div
            key={cat.id}
            className={`circle-item ${category === cat.id ? 'active' : ''}`}
            onClick={() => {
              setCategory(category === cat.id ? 'Tất cả' : cat.id);
              document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="circle-icon">{cat.icon}</div>
            <span className="circle-name">{cat.label}</span>
          </div>
        ))}
      </section>
    </>
  );
}

