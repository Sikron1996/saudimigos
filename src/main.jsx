import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserProvider, Contract, JsonRpcProvider, formatEther, parseEther } from "ethers";
import { ArrowLeft, ArrowRight, ExternalLink, Minus, Plus, Wallet } from "lucide-react";
import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider
} from "@reown/appkit/react";
import { NFT_ABI } from "./abi";
import { SITE_CONFIG } from "./config";
import { robinhoodChain } from "./appkit";
import "./styles.css";

const nftImages = [
  "/nfts/saudimigo-1.jpeg",
  "/nfts/saudimigo-2.jpeg",
  "/nfts/saudimigo-3.jpeg",
  "/nfts/saudimigo-4.jpeg",
  "/nfts/saudimigo-5.jpeg"
];

function shortAddress(address) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
}

function App() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId, switchNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider("eip155");

  const [quantity, setQuantity] = useState(1);
  const [minted, setMinted] = useState(0);
  const [price, setPrice] = useState(SITE_CONFIG.mintPrice);
  const [walletMinted, setWalletMinted] = useState(0);
  const [mintEnabled, setMintEnabled] = useState(true);
  const [slide, setSlide] = useState(0);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [walletBalance, setWalletBalance] = useState("0");
  const [successTx, setSuccessTx] = useState("");

  const provider = useMemo(
    () => new JsonRpcProvider(SITE_CONFIG.rpcUrl),
    []
  );

  const readContract = useMemo(
    () => new Contract(SITE_CONFIG.contractAddress, NFT_ABI, provider),
    [provider]
  );

  const loadStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const [supply, mintPrice, enabled] = await Promise.all([
        readContract.totalMinted(),
        readContract.MINT_PRICE(),
        readContract.mintEnabled()
      ]);
      setMinted(Number(supply));
      setPrice(formatEther(mintPrice));
      setMintEnabled(Boolean(enabled));

      if (address) {
        const mine = await readContract.minted(address);
        setWalletMinted(Number(mine));
      } else {
        setWalletMinted(0);
        setWalletBalance("0");
      }

      if (address) {
        const balance = await provider.getBalance(address);
        setWalletBalance(Number(formatEther(balance)).toFixed(4));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStats(false);
    }
  }, [readContract, address, provider]);

  useEffect(() => {
    loadStats();
    const timer = setInterval(loadStats, 15000);
    return () => clearInterval(timer);
  }, [loadStats]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((current) => (current + 1) % nftImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  async function ensureNetwork() {
    if (Number(chainId) !== SITE_CONFIG.chainId) {
      await switchNetwork(robinhoodChain);
    }
  }

  async function handleMint() {
    setStatus("");
    setSuccessTx("");

    if (!isConnected) {
      await open({ view: "Connect" });
      return;
    }

    if (!walletProvider || !address) {
      setStatus("Connect your wallet first.");
      return;
    }

    if (!mintEnabled) {
      setStatus("Mint is currently closed.");
      return;
    }

    if (walletMinted + quantity > SITE_CONFIG.walletLimit) {
      setStatus(`Wallet limit is ${SITE_CONFIG.walletLimit} NFTs.`);
      return;
    }

    setBusy(true);
    setStatus("Confirm the transaction in your wallet…");

    try {
      await ensureNetwork();

      const browserProvider = new BrowserProvider(walletProvider);
      const signer = await browserProvider.getSigner();
      const nft = new Contract(SITE_CONFIG.contractAddress, NFT_ABI, signer);

      const value = parseEther(price) * BigInt(quantity);
      const tx = await nft.mint(quantity, { value });

      setStatus("Transaction sent. Waiting for confirmation…");
      await tx.wait();

      setSuccessTx(tx.hash);
      setStatus("");
      await loadStats();
    } catch (error) {
      setStatus(
        error?.shortMessage ||
        error?.reason ||
        error?.message ||
        "Mint failed."
      );
    } finally {
      setBusy(false);
    }
  }

  const total = (Number(price) * quantity).toFixed(5);
  const progress = Math.min((minted / SITE_CONFIG.supply) * 100, 100);

  function changeQuantity(delta) {
    const maxAvailable = Math.max(
      1,
      Math.min(SITE_CONFIG.walletLimit - walletMinted, SITE_CONFIG.supply - minted)
    );
    setQuantity((value) => Math.min(maxAvailable, Math.max(1, value + delta)));
  }

  function setQuickQuantity(value) {
    const maxAvailable = Math.max(
      1,
      Math.min(SITE_CONFIG.walletLimit - walletMinted, SITE_CONFIG.supply - minted)
    );
    setQuantity(Math.min(value, maxAvailable));
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">SA</span>
          <span>SAUDIMIGOS</span>
        </a>

        <div className="top-actions">
          <a
            className="utility-link"
            href={SITE_CONFIG.explorerUrl}
            target="_blank"
            rel="noreferrer"
          >
            CONTRACT <ExternalLink size={12} />
          </a>

          <button
            className="connect"
            onClick={() => open({ view: isConnected ? "Account" : "Connect" })}
          >
            <Wallet size={14} />
            {isConnected ? shortAddress(address) : "CONNECT"}
          </button>
        </div>
      </header>

      <section className="hero-strip">
        <img src="/banner.jpeg" alt="Saudimigos" />
        <div className="hero-stamp">5000<br /><span>PIXEL SOULS</span></div>
      </section>

      <section className="mint-console">
        <div className="preview-zone">
          <div className="preview-topline">
            <span>SAUDIMIGOS // FIELD TEST</span>
            <strong>{String(slide + 1).padStart(2, "0")} / {String(nftImages.length).padStart(2, "0")}</strong>
          </div>

          <div className="art-frame">
            <div className="corner corner-tl" />
            <div className="corner corner-tr" />
            <div className="corner corner-bl" />
            <div className="corner corner-br" />

            <img
              src={nftImages[slide]}
              alt={`Saudimigo preview ${slide + 1}`}
              className="nft-preview"
            />

            {loadingStats && (
              <div className="loading-overlay">
                <img src={nftImages[0]} alt="" />
                <span>LOADING...</span>
              </div>
            )}

            <button
              className="slider-btn left"
              onClick={() =>
                setSlide((slide - 1 + nftImages.length) % nftImages.length)
              }
              aria-label="Previous NFT"
            >
              <ArrowLeft size={18} />
            </button>

            <button
              className="slider-btn right"
              onClick={() => setSlide((slide + 1) % nftImages.length)}
              aria-label="Next NFT"
            >
              <ArrowRight size={18} />
            </button>

            <div className="edition-label">
              <span>SAUDIMIGO</span>
              <strong>#{String(slide + 1).padStart(4, "0")}</strong>
            </div>
          </div>

          <div className="slider-bottom">
            <div className="dots">
              {nftImages.map((_, index) => (
                <button
                  key={index}
                  className={index === slide ? "dot active" : "dot"}
                  onClick={() => setSlide(index)}
                  aria-label={`Show NFT ${index + 1}`}
                />
              ))}
            </div>
            <span>ARROW KEYS / SWIPE TO EXPLORE</span>
          </div>
        </div>

        <div className="mint-zone">
          <div className="zone-label">
            <span>RH / 4663</span>
            <span>ON-CHAIN MINT</span>
          </div>

          <div className="title-block">
            <div className="mini-signal">◆</div>
            <div>
              <div className="eyebrow">ROBINHOOD CHAIN</div>
              <h1>SAUDIMIGOS</h1>
            </div>
          </div>

          <p className="tagline">
            Pixel characters from the desert.<br />
            <b>One collection. 5,000 stories.</b>
          </p>

          <div className="data-grid">
            <div className="data-cell wide">
              <span>MINTED</span>
              <strong>{minted.toLocaleString()}<small> / 5,000</small></strong>
            </div>
            <div className="data-cell">
              <span>PRICE</span>
              <strong>{price}</strong>
              <small>ETH</small>
            </div>
            <div className="data-cell">
              <span>WALLET</span>
              <strong>{SITE_CONFIG.walletLimit}</strong>
              <small>MAX</small>
            </div>
          </div>

          <div className="progress-wrap">
            <div className="progress-meta">
              <span>MINT PROGRESS</span>
              <strong>{progress.toFixed(2)}%</strong>
            </div>
            <div className="progress">
              <span style={{ width: `${progress}%` }} />
              <i />
            </div>
          </div>

          {isConnected ? (
            <div className="wallet-strip">
              <div>
                <span>YOUR MINTS</span>
                <strong>{walletMinted} / {SITE_CONFIG.walletLimit}</strong>
              </div>
              <div>
                <span>WALLET</span>
                <strong>{shortAddress(address)}</strong>
              </div>
              <div>
                <span>BALANCE</span>
                <strong>{walletBalance} ETH</strong>
              </div>
              <a
                href={`${SITE_CONFIG.explorerBaseUrl}/address/${address}`}
                target="_blank"
                rel="noreferrer"
                aria-label="View wallet"
              >
                ↗
              </a>
            </div>
          ) : (
            <div className="wallet-strip offline">
              <span>CONNECT WALLET TO SEE YOUR MINTS</span>
            </div>
          )}

          <div className="mint-controls">
            <div className="quantity-head">
              <span>SELECT QUANTITY</span>
              <strong>{total} ETH TOTAL</strong>
            </div>

            <div className="quantity">
              <button
                onClick={() => changeQuantity(-1)}
                disabled={busy || quantity <= 1}
                aria-label="Decrease quantity"
              >
                <Minus size={17} />
              </button>
              <strong>{String(quantity).padStart(2, "0")}</strong>
              <button
                onClick={() => changeQuantity(1)}
                disabled={busy}
                aria-label="Increase quantity"
              >
                <Plus size={17} />
              </button>
            </div>

            <div className="quick-quantities">
              {[5, 10, 25, 50].map((value) => (
                <button
                  key={value}
                  onClick={() => setQuickQuantity(value)}
                  disabled={
                    busy ||
                    walletMinted + value > SITE_CONFIG.walletLimit ||
                    minted + value > SITE_CONFIG.supply
                  }
                >
                  {value}
                </button>
              ))}
              <button
                onClick={() =>
                  setQuickQuantity(
                    Math.max(
                      1,
                      Math.min(
                        SITE_CONFIG.walletLimit - walletMinted,
                        SITE_CONFIG.supply - minted
                      )
                    )
                  )
                }
                disabled={busy}
              >
                MAX
              </button>
            </div>
          </div>

          <button
            className="mint-button"
            onClick={handleMint}
            disabled={busy || minted >= SITE_CONFIG.supply || !mintEnabled}
          >
            <span className="mint-arrow">→</span>
            <span>
              {busy
                ? "PROCESSING..."
                : !mintEnabled
                  ? "MINT CLOSED"
                  : isConnected
                    ? `MINT ${quantity}`
                    : "CONNECT WALLET"}
            </span>
            <span className="mint-price">{total} ETH</span>
          </button>

          {status && <div className="status">{status}</div>}

          {successTx && (
            <div className="success-screen">
              <div className="success-icon">✦</div>
              <div>
                <strong>YOU GOT YOUR SAUDIMIGO</strong>
                <span>Transaction confirmed</span>
              </div>
              <a
                href={`${SITE_CONFIG.explorerBaseUrl}/tx/${successTx}`}
                target="_blank"
                rel="noreferrer"
              >
                VIEW TRANSACTION ↗
              </a>
            </div>
          )}

          <div className="console-links">
            <a href={SITE_CONFIG.openSeaUrl} target="_blank" rel="noreferrer">
              OPENSEA ↗
            </a>
            <a href={SITE_CONFIG.twitterUrl} target="_blank" rel="noreferrer">
              X / SAUDIMIGOS ↗
            </a>
          </div>

          <div className="fine-print">
            5% ROYALTY · 5,000 SUPPLY · 0.00005 ETH MINT · ROBINHOOD CHAIN
          </div>
        </div>
      </section>

      <footer>
        <span>SAUDIMIGOS © 2026</span>
        <span>BUILT ON ROBINHOOD CHAIN</span>
      </footer>
    </main>
  )

}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
