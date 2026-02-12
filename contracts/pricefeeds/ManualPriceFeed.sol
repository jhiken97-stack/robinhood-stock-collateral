// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.15;

import "../IPriceFeed.sol";

/**
 * @title Manual price feed
 * @notice Chainlink-compatible feed for testnet/dev environments with guarded manual updates
 */
contract ManualPriceFeed is IPriceFeed {
    error BadPrice();
    error NoData();
    error NotAuthorized();
    error InvalidConfig();
    error MaxChangeExceeded();

    uint public constant override version = 1;
    uint16 public constant BPS_SCALE = 10_000;

    string public override description;
    uint8 public immutable override decimals;

    address public owner;
    address public updater;

    // Maximum absolute price move allowed per update, measured in bps.
    uint16 public maxChangeBps;
    bool public paused;

    struct RoundData {
        int256 answer;
        uint256 startedAt;
        uint256 updatedAt;
        uint80 answeredInRound;
    }

    mapping(uint80 => RoundData) internal rounds;
    uint80 public latestRoundId;

    event OwnerTransferred(address indexed oldOwner, address indexed newOwner);
    event UpdaterSet(address indexed oldUpdater, address indexed newUpdater);
    event MaxChangeBpsSet(uint16 oldValue, uint16 newValue);
    event PauseSet(bool paused_);
    event PriceUpdated(uint80 indexed roundId, int256 answer, uint256 updatedAt);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    modifier onlyOwnerOrUpdater() {
        if (msg.sender != owner && msg.sender != updater) revert NotAuthorized();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert NotAuthorized();
        _;
    }

    constructor(
        uint8 decimals_,
        string memory description_,
        address owner_,
        address updater_,
        uint16 maxChangeBps_,
        int256 initialAnswer_
    ) {
        if (owner_ == address(0) || updater_ == address(0)) revert InvalidConfig();
        if (maxChangeBps_ > BPS_SCALE) revert InvalidConfig();
        if (initialAnswer_ <= 0) revert BadPrice();

        decimals = decimals_;
        description = description_;
        owner = owner_;
        updater = updater_;
        maxChangeBps = maxChangeBps_;

        _setRoundData(initialAnswer_);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidConfig();
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setUpdater(address newUpdater) external onlyOwner {
        if (newUpdater == address(0)) revert InvalidConfig();
        emit UpdaterSet(updater, newUpdater);
        updater = newUpdater;
    }

    function setMaxChangeBps(uint16 newMaxChangeBps) external onlyOwner {
        if (newMaxChangeBps > BPS_SCALE) revert InvalidConfig();
        emit MaxChangeBpsSet(maxChangeBps, newMaxChangeBps);
        maxChangeBps = newMaxChangeBps;
    }

    function setPaused(bool paused_) external onlyOwner {
        paused = paused_;
        emit PauseSet(paused_);
    }

    function setRoundData(int256 newAnswer) external onlyOwnerOrUpdater whenNotPaused {
        _setRoundData(newAnswer);
    }

    // Optional Chainlink function, provided for compatibility with tooling.
    function getRoundData(uint80 roundId) external view returns (
        uint80,
        int256,
        uint256,
        uint256,
        uint80
    ) {
        RoundData memory round = rounds[roundId];
        if (round.updatedAt == 0) revert NoData();
        return (roundId, round.answer, round.startedAt, round.updatedAt, round.answeredInRound);
    }

    function latestRoundData() external view override returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        if (latestRoundId == 0) revert NoData();
        RoundData memory round = rounds[latestRoundId];
        return (latestRoundId, round.answer, round.startedAt, round.updatedAt, round.answeredInRound);
    }

    function _setRoundData(int256 newAnswer) internal {
        if (newAnswer <= 0) revert BadPrice();

        uint80 oldRoundId = latestRoundId;
        if (oldRoundId > 0) {
            int256 oldAnswer = rounds[oldRoundId].answer;
            int256 diff = oldAnswer > newAnswer ? oldAnswer - newAnswer : newAnswer - oldAnswer;
            // diff / oldAnswer <= maxChangeBps / BPS_SCALE
            if (uint256(diff) * BPS_SCALE > uint256(oldAnswer) * maxChangeBps) revert MaxChangeExceeded();
        }

        uint80 nextRoundId = oldRoundId + 1;
        uint256 nowTs = block.timestamp;

        rounds[nextRoundId] = RoundData({
            answer: newAnswer,
            startedAt: nowTs,
            updatedAt: nowTs,
            answeredInRound: nextRoundId
        });
        latestRoundId = nextRoundId;
        emit PriceUpdated(nextRoundId, newAnswer, nowTs);
    }
}
