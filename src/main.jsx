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
    <main>
      <header className="topbar">
        <div className="brand">SAUDIMIGOS</div>

        <div className="top-actions">
          <a
            className="scan"
            href={SITE_CONFIG.explorerUrl}
            target="_blank"
            rel="noreferrer"
          >
            CONTRACT <ExternalLink size={14} />
          </a>

          <button
            className="connect"
            onClick={() => open({ view: isConnected ? "Account" : "Connect" })}
          >
            <Wallet size={16} />
            {isConnected ? shortAddress(address) : "CONNECT WALLET"}
          </button>
        </div>
      </header>

      <section className="hero">
        <img src="/banner.jpeg" alt="Saudimigos banner" />
      </section>

      <section className="mint-section">
        <div className="art-side">
          <div className="art-frame">
            <img
              src={nftImages[slide]}
              alt={`Saudimigo preview ${slide + 1}`}
              className="nft-preview"
            />
            {loadingStats && (
              <div className="loading-overlay">
                <img src={nftImages[0]} alt="" />
                <strong>LOADING...</strong>
              </div>
            )}

            <button
              className="slider-btn left"
              onClick={() =>
                setSlide((slide - 1 + nftImages.length) % nftImages.length)
              }
              aria-label="Previous NFT"
            >
              <ArrowLeft size={20} />
            </button>

            <button
              className="slider-btn right"
              onClick={() => setSlide((slide + 1) % nftImages.length)}
              aria-label="Next NFT"
            >
              <ArrowRight size={20} />
            </button>
          </div>

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
        </div>

        <div className="mint-card">
          <div className="eyebrow">ROBINHOOD CHAIN</div>
          <h1>SAUDIMIGOS</h1>
          <p className="tagline">
            Pixel characters from the desert.
            <br />
            5,000 Saudimigos. One collection.
          </p>

          <div className="stats">
            <div>
              <span>MINTED</span>
              <strong>{minted.toLocaleString()} / {SITE_CONFIG.supply.toLocaleString()}</strong>
            </div>
            <div>
              <span>PRICE</span>
              <strong>{price} ETH</strong>
            </div>
            <div>
              <span>WALLET LIMIT</span>
              <strong>{SITE_CONFIG.walletLimit}</strong>
            </div>
          </div>

          <div className="progress-label">
            <span>MINT PROGRESS</span>
            <strong>{minted.toLocaleString()} / {SITE_CONFIG.supply.toLocaleString()} MINTED</strong>
          </div>
          <div className="progress">
            <span style={{ width: `${progress}%` }} />
          </div>

          {isConnected && (
            <div className="wallet-section">
              <div className="wallet-stat">
                <span>YOUR MINTS</span>
                <strong>{walletMinted} / {SITE_CONFIG.walletLimit}</strong>
              </div>
              <div className="wallet-row">
                <span>{shortAddress(address)}</span>
                <span>{walletBalance} ETH</span>
              </div>
              <a
                className="wallet-link"
                href={`${SITE_CONFIG.explorerBaseUrl}/address/${address}`}
                target="_blank"
                rel="noreferrer"
              >
                VIEW WALLET <ExternalLink size={13} />
              </a>
            </div>
          )}

          <div className="quantity-label">QUANTITY</div>
          <div className="quantity">
            <button
              onClick={() => changeQuantity(-1)}
              disabled={busy || quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus size={18} />
            </button>
            <strong>{quantity}</strong>
            <button
              onClick={() => changeQuantity(1)}
              disabled={busy}
              aria-label="Increase quantity"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="quick-quantities">
            {[5, 10, 25, 50].map((value) => (
              <button
                key={value}
                onClick={() => setQuickQuantity(value)}
                disabled={busy || walletMinted + value > SITE_CONFIG.walletLimit || minted + value > SITE_CONFIG.supply}
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

          <div className="total">
            <span>TOTAL</span>
            <strong>{total} ETH</strong>
          </div>

          <button
            className="mint-button"
            onClick={handleMint}
            disabled={busy || minted >= SITE_CONFIG.supply || !mintEnabled}
          >
            <Wallet size={19} />
            {busy
              ? "PROCESSING…"
              : !mintEnabled
                ? "MINT CLOSED"
                : isConnected
                  ? `MINT ${quantity}`
                  : "CONNECT WALLET"}
          </button>

          {status && <div className="status">{status}</div>}

          {successTx && (
            <div className="success-screen">
              <div className="success-art">🎉</div>
              <div>
                <strong>YOU GOT YOUR SAUDIMIGO</strong>
                <span>Transaction confirmed</span>
              </div>
              <a
                href={`${SITE_CONFIG.explorerBaseUrl}/tx/${successTx}`}
                target="_blank"
                rel="noreferrer"
              >
                VIEW TRANSACTION <ExternalLink size={13} />
              </a>
            </div>
          )}

          <div className="market-links">
            <a href={SITE_CONFIG.openSeaUrl} target="_blank" rel="noreferrer">
              VIEW COLLECTION <ExternalLink size={13} />
            </a>
          </div>

          <div className="fine-print">
            5% creator royalty · Max supply 5,000 · Mint on Robinhood Chain
          </div>
        </div>
      </section>

      <footer>
        <span>SAUDIMIGOS</span>
        <div className="footer-links">
          <a href={SITE_CONFIG.twitterUrl} target="_blank" rel="noreferrer">
            FOLLOW SAUDIMIGOS <ExternalLink size={13} />
          </a>
          <a
            href={SITE_CONFIG.explorerUrl}
          target="_blank"
          rel="noreferrer"
          >
            VIEW CONTRACT <ExternalLink size={13} />
          </a>
        </div>
      </footer>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
