
import { useEffect, useMemo, useState } from "react";
import offerBanner from "../../assets/offer-banner.png";
import { getPlans } from "../lib/billing-plans";

type Plan = {
  id: string;
  name: string;
  price: number;
  speed?: string;
  validity_days?: number;
  description?: string;
};

function getPlanBadge(planName: string) {
  const key = planName.trim().toLowerCase();

  if (key === "bronze_100mbps_9m+3m") {
    return {
      label: "Value for Money",
      bg: "linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(217, 70, 239, 0.18))",
      color: "#ffe7a8",
      border: "1px solid rgba(245, 158, 11, 0.26)",
    };
  }

  if (key === "bronze_100mbps_5m+1m") {
    return {
      label: "Best Selling",
      bg: "linear-gradient(135deg, rgba(236, 72, 153, 0.22), rgba(168, 85, 247, 0.18))",
      color: "#ffd1ef",
      border: "1px solid rgba(236, 72, 153, 0.28)",
    };
  }

  return null;
}

export default function BillingHome() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPlans();
        const sorted = [...(data || [])].sort(
          (a, b) => Number(a.price || 0) - Number(b.price || 0)
        );
        setPlans(sorted);
      } catch {
        setPlans([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const featuredPlans = useMemo(() => plans.slice(0, 9), [plans]);

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes ddxFloatY {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
          100% { transform: translateY(0px); }
        }

        @keyframes ddxGlow {
          0% { opacity: 0.68; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.68; transform: scale(1); }
        }
.ddx-plan-card:hover {
  transform: translateY(-8px);
  border-color: rgba(255, 196, 94, 0.18);
  box-shadow:
    0 28px 70px rgba(0, 0, 0, 0.34),
    0 0 0 1px rgba(255, 255, 255, 0.04),
    0 0 30px rgba(217, 70, 239, 0.10);
}
        

        .ddx-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 16px 34px rgba(236, 72, 153, 0.24);
        }

        .ddx-banner-image:hover {
          transform: scale(1.01);
        }

        @media (max-width: 1120px) {
          .ddx-plans-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 768px) {
          .ddx-main-title {
            font-size: 34px !important;
            letter-spacing: -1px !important;
          }

          .ddx-sub-title {
            font-size: 20px !important;
          }

          .ddx-section-title {
            font-size: 24px !important;
          }

          .ddx-plans-grid {
            grid-template-columns: 1fr !important;
          }

          .ddx-banner-image {
            height: auto !important;
            max-height: none !important;
            object-fit: contain !important;
          }

          .ddx-banner-overlay {
            left: 12px !important;
            right: 12px !important;
            bottom: 12px !important;
          }
        }
      `}</style>

      <div style={styles.bg}>
        <div style={styles.orbA} />
        <div style={styles.orbB} />
        <div style={styles.orbC} />
      </div>

      <section style={styles.hero}>
        <div style={styles.heroBadge}>Smart Internet Solutions</div>

        <div className="ddx-main-title" style={styles.mainTitle}>
          AJCOMPUTERS
        </div>

        <div className="ddx-sub-title" style={styles.subTitle}>
          Cable and Broadband Services
        </div>

        <p style={styles.subtitle}>
          AJCOMPUTERS is the resale partner of Kolkata's top notch Broadband and IPTV Service Provider, like Alliance, Meghbela, MRMPL, Wishnet, GenZ, Zitatel and Oxynet at Shyambazar Belgachia locality
        </p>

        <div style={styles.heroActions}>
          <a href="tel:9007778382" className="ddx-btn" style={styles.primaryBtn}>
            📞 Contact 9007778382
          </a>
        </div>
      </section>

      <section style={styles.bannerSection}>
          <div style={styles.bannerGlow} />

          <img
            src={offerBanner}
            alt="AJCOMPUTERS broadband offer banner"
            className="ddx-banner-image"
            style={styles.bannerImage}
          />

          <div className="ddx-banner-overlay" style={styles.bannerOverlay}>
            <div style={styles.bannerTextWrap}>
             <a href="tel:9007778382" className="ddx-btn" style={styles.secondaryBtn}>
              Book This Offer
            </a>
          </div>
        </div>
      </section>

      <section style={styles.section}>
  <div style={styles.sectionHead}>
    <div style={styles.sectionPill}>Premium Plan Collection</div>

    <h2 className="ddx-section-title" style={styles.sectionTitle}>
      Broadband Plans & Pricing
    </h2>

    <p style={styles.sectionSub}>
      Attractive Plans to choose from the bucket.
    </p>
  </div>

  {loading ? (
    <div style={styles.emptyCard}>Loading plans...</div>
  ) : featuredPlans.length === 0 ? (
    <div style={styles.emptyCard}>
      No plans available right now. Please contact{" "}
      <a href="tel:9007778382" style={styles.inlineLink}>
        9007778382
      </a>{" "}
      for latest offers.
    </div>
  ) : (
    <div className="ddx-plans-grid" style={styles.grid}>
      {featuredPlans.map((plan) => {
        const badge = getPlanBadge(plan.name);

        return (
          <div key={plan.id} className="ddx-plan-card" style={styles.card}>
            <div style={styles.cardGlow} />

            {badge ? (
              <div
                style={{
                  ...styles.badgeTag,
                  background: badge.bg,
                  color: badge.color,
                  border: badge.border,
                }}
              >
                {badge.label}
              </div>
            ) : (
              <div style={styles.topMiniTag}>Broadband Plan</div>
            )}

            <h3 style={styles.planName}>{plan.name}</h3>

            <div style={styles.priceWrap}>
              <div style={styles.price}>₹{plan.price}</div>
              <div style={styles.priceCaption}>One-time / package price</div>
            </div>

            <div style={styles.metaRow}>
              <span style={styles.metaChip}>{plan.speed || "High Speed"}</span>
              <span style={styles.metaChip}>{plan.validity_days || 30} Days</span>
            </div>

            <p style={styles.desc}>
              {plan.description ||
                "Stable broadband connection with clear speed and validity benefits."}
            </p>

            <div style={styles.planDivider} />

            <div style={styles.planInfoGrid}>
              <div style={styles.planInfoBox}>
                <span style={styles.planInfoLabel}>Speed</span>
                <span style={styles.planInfoValue}>{plan.speed || "Available"}</span>
              </div>

              <div style={styles.planInfoBox}>
                <span style={styles.planInfoLabel}>Validity</span>
                <span style={styles.planInfoValue}>
                  {plan.validity_days || 30} Days
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )}
</section>

      <footer style={styles.footer}>
        © 2017 AJCOMPUTERS Cable and Broadband Services - All Rights Reserved
      </footer>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #0f0912 0%, #120813 30%, #180b18 65%, #130710 100%)",
    color: "white",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    overflowX: "hidden",
    position: "relative",
  },

  bg: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    pointerEvents: "none",
  },

  orbA: {
    position: "absolute",
    width: 340,
    height: 340,
    top: 0,
    left: -100,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(236,72,153,0.20), transparent 68%)",
    filter: "blur(90px)",
    animation: "ddxFloatY 12s ease-in-out infinite, ddxGlow 8s ease-in-out infinite",
  },

  orbB: {
    position: "absolute",
    width: 420,
    height: 420,
    top: 140,
    right: -110,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(245,158,11,0.18), transparent 70%)",
    filter: "blur(110px)",
    animation: "ddxFloatY 15s ease-in-out infinite, ddxGlow 10s ease-in-out infinite",
  },

  orbC: {
    position: "absolute",
    width: 320,
    height: 320,
    bottom: 40,
    left: "38%",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(168,85,247,0.16), transparent 70%)",
    filter: "blur(90px)",
    animation: "ddxFloatY 18s ease-in-out infinite, ddxGlow 11s ease-in-out infinite",
  },

  hero: {
    position: "relative",
    zIndex: 2,
    maxWidth: 1080,
    margin: "0 auto",
    textAlign: "center",
    padding: "66px 20px 20px",
  },

  heroBadge: {
    display: "inline-block",
    padding: "10px 16px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.4,
    color: "#ffe8c1",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(245,158,11,0.16)",
    backdropFilter: "blur(10px)",
    marginBottom: 20,
  },

  mainTitle: {
    margin: 0,
    fontSize: 70,
    lineHeight: 0.94,
    fontWeight: 1000,
    letterSpacing: -3,
    textTransform: "uppercase",
    fontFamily:
      '"Arial Black", "Segoe UI", Inter, ui-sans-serif, system-ui, sans-serif',
    background: "linear-gradient(180deg, #fff7ea 0%, #ffe2a8 55%, #ffbf5f 100%)",
    WebkitBackgroundClip: "text",
    color: "transparent",
    textShadow:
      "0 2px 0 rgba(0,0,0,0.22), 0 10px 24px rgba(245,158,11,0.10), 0 0 18px rgba(236,72,153,0.08)",
    filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.25))",
  },

  subTitle: {
    margin: "6px 0 18px",
    fontSize: 28,
    lineHeight: 1.1,
    fontWeight: 800,
    letterSpacing: -0.5,
    background: "linear-gradient(135deg, #ffd27a 0%, #ff7ac8 100%)",
    WebkitBackgroundClip: "text",
    color: "transparent",
  },

  subtitle: {
    maxWidth: 760,
    margin: "0 auto 24px",
    fontSize: 17,
    lineHeight: 1.8,
    color: "rgba(255,238,224,0.76)",
  },

  heroActions: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 12,
  },

  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 24px",
    borderRadius: 14,
    background: "linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)",
    color: "#fff",
    fontWeight: 800,
    textDecoration: "none",
    boxShadow: "0 10px 30px rgba(236,72,153,0.20)",
    transition: "all 0.25s ease",
  },

  bannerSection: {
    position: "relative",
    zIndex: 2,
    maxWidth: 1140,
    margin: "0 auto",
    padding: "10px 20px 24px",
  },

  bannerCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    boxShadow: "0 26px 70px rgba(0,0,0,0.40)",
  },

  bannerGlow: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
    pointerEvents: "none",
    background:
      "radial-gradient(circle at 18% 30%, rgba(245,158,11,0.12), transparent 32%), radial-gradient(circle at 84% 25%, rgba(236,72,153,0.12), transparent 36%)",
    filter: "blur(30px)",
  },

  bannerImage: {
    width: "100%",
    height: "auto",
    objectFit: "contain",
    display: "block",
    position: "relative",
    zIndex: 2,
    transition: "transform 0.6s ease",
  },

  bannerOverlay: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
    zIndex: 3,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },

  bannerTextWrap: {
    padding: "12px 16px",
    borderRadius: 14,
    background: "rgba(18, 9, 20, 0.72)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
  },

  bannerTextTop: {
    color: "#fff0c4",
    fontWeight: 800,
    fontSize: 14,
    marginBottom: 2,
  },

  bannerTextBottom: {
    color: "rgba(255,236,220,0.80)",
    fontSize: 13,
    fontWeight: 700,
  },

  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 20px",
    borderRadius: 14,
    background: "linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)",
    color: "#fff",
    fontWeight: 800,
    textDecoration: "none",
    boxShadow: "0 10px 26px rgba(236,72,153,0.18)",
    transition: "all 0.25s ease",
  },

  section: {
  position: "relative",
  zIndex: 2,
  maxWidth: 1180,
  margin: "0 auto",
  padding: "28px 20px 48px",
},

sectionHead: {
  textAlign: "center",
  marginBottom: 28,
},

sectionPill: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 16px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.4,
  color: "#ffe4a8",
  background: "linear-gradient(135deg, rgba(245,158,11,0.10), rgba(217,70,239,0.10))",
  border: "1px solid rgba(255,196,94,0.14)",
  marginBottom: 14,
  boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
},

sectionTitle: {
  margin: "0 0 8px",
  fontSize: 38,
  fontWeight: 1000,
  letterSpacing: -1.1,
  color: "#fff1d2",
  textShadow: "0 6px 22px rgba(245,158,11,0.08)",
},

sectionSub: {
  margin: 0,
  fontSize: 15,
  color: "rgba(255,236,220,0.74)",
},

grid: {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 22,
  alignItems: "stretch",
},

card: {
  position: "relative",
  overflow: "hidden",
  padding: 24,
  borderRadius: 24,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.025) 100%)",
  border: "1px solid rgba(255,255,255,0.09)",
  backdropFilter: "blur(16px)",
  transition: "all 0.3s ease",
  boxShadow:
    "0 16px 38px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.03)",
},

cardGlow: {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(circle at top right, rgba(245,158,11,0.12), transparent 34%), radial-gradient(circle at bottom left, rgba(217,70,239,0.10), transparent 34%)",
},

badgeTag: {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 12px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 900,
  marginBottom: 14,
  letterSpacing: 0.35,
  boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
},

topMiniTag: {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 12px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 800,
  marginBottom: 14,
  letterSpacing: 0.35,
  background: "rgba(255,255,255,0.05)",
  color: "rgba(255,233,205,0.78)",
  border: "1px solid rgba(255,255,255,0.07)",
},

planName: {
  margin: "0 0 14px",
  fontSize: 20,
  fontWeight: 900,
  color: "#fff3d8",
  lineHeight: 1.3,
},

priceWrap: {
  marginBottom: 14,
},

price: {
  fontSize: 42,
  fontWeight: 1000,
  lineHeight: 1,
  color: "#ffd06c",
  letterSpacing: -1.2,
  textShadow: "0 0 22px rgba(245,158,11,0.12)",
},

priceCaption: {
  marginTop: 6,
  fontSize: 12,
  fontWeight: 700,
  color: "rgba(255,232,205,0.58)",
  letterSpacing: 0.3,
},

metaRow: {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 14,
},

metaChip: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.07)",
  color: "#ffe8cb",
  fontSize: 12,
  fontWeight: 800,
},

desc: {
  margin: "0 0 18px",
  fontSize: 14,
  lineHeight: 1.8,
  color: "rgba(255,236,220,0.76)",
  minHeight: 76,
},

planDivider: {
  height: 1,
  margin: "16px 0 18px",
  background:
    "linear-gradient(90deg, rgba(245,158,11,0.22), rgba(217,70,239,0.14), transparent)",
},

planInfoGrid: {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
},

planInfoBox: {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: "12px 12px",
  borderRadius: 16,
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.06)",
},

planInfoLabel: {
  color: "rgba(255,233,205,0.60)",
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0.3,
  textTransform: "uppercase",
},

planInfoValue: {
  color: "#fff9e7",
  fontSize: 15,
  fontWeight: 900,
},

emptyCard: {
  padding: 28,
  borderRadius: 20,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,244,228,0.76)",
  textAlign: "center",
},

inlineLink: {
  color: "#ffd27a",
  fontWeight: 800,
  textDecoration: "none",
},

  footer: {
    position: "relative",
    zIndex: 2,
    textAlign: "center",
    padding: "8px 20px 28px",
    fontSize: 14,
    color: "rgba(255,240,222,0.74)",
  },
};