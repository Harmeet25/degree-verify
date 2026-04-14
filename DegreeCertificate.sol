// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// ═══════════════════════════════════════════════════════════
//  DegreeCertificate.sol  v5 — FINAL (Stack Fixed)
// ═══════════════════════════════════════════════════════════

contract DegreeCertificate {

    struct Certificate {
        address issuer;
        address student;        // admin wallet used if student has none
        string  enrolmentNumber;
        string  studentName;
        string  degree;
        string  fieldOfStudy;
        string  university;
        uint256 year;
        string  certHash;       // keccak256 hex string from frontend
        string  certId;         // human-readable ID
        uint256 timestamp;
        bool    isValid;
    }

    Certificate[]                            private allCerts;
    mapping(string  => uint256)              private hashToIndex;    // certHash  → slot+1
    mapping(string  => uint256)              private enrolToIndex;   // enrolment → slot+1
    mapping(address => uint256[])            private studentIndexes;
    mapping(address => bool)                 public  authorisedIssuers;
    address                                  public  owner;
    uint256                                  public  totalCertificates;

    event CertificateIssued(string certHash, string enrolmentNumber, string studentName);
    event IssuerAuthorised(address issuer);

    modifier onlyOwner()      { require(msg.sender == owner, "Not owner"); _; }
    modifier onlyAuthorised() {
        require(msg.sender == owner || authorisedIssuers[msg.sender], "Not authorised");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorisedIssuers[msg.sender] = true;
    }

    function authoriseIssuer(address _issuer) external onlyOwner {
        authorisedIssuers[_issuer] = true;
        emit IssuerAuthorised(_issuer);
    }

    // ── Batch issue (Admin Excel upload) ─────────────────────
    // Reverted arrays back to 'memory' to fix the EVM Stack Too Deep error
    function batchIssueCertificates(
        address[] memory _students,
        string[]  memory _enrolments,
        string[]  memory _names,
        string[]  memory _degrees,
        string[]  memory _fields,
        string[]  memory _universities,
        uint256[] memory _years,
        string[]  memory _certHashes,
        string[]  memory _certIds
    ) external onlyAuthorised {
        uint256 len = _students.length;
        require(
            _enrolments.length   == len &&
            _names.length        == len &&
            _degrees.length      == len &&
            _fields.length       == len &&
            _universities.length == len &&
            _years.length        == len &&
            _certHashes.length   == len &&
            _certIds.length      == len,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < len; i++) {
            // Only skip genuine duplicates
            if (bytes(_certHashes[i]).length == 0)    continue;
            if (hashToIndex[_certHashes[i]]  != 0)   continue;
            if (enrolToIndex[_enrolments[i]] != 0)   continue;

            // Use admin wallet when no student wallet provided
            address student = (_students[i] == address(0)) ? msg.sender : _students[i];

            _store(student, _enrolments[i], _names[i], _degrees[i],
                   _fields[i], _universities[i], _years[i], _certHashes[i], _certIds[i]);
        }
    }

    function _store(
        address _student,
        string memory _enrolment,
        string memory _name,
        string memory _degree,
        string memory _field,
        string memory _university,
        uint256 _year,
        string memory _certHash,
        string memory _certId
    ) internal {
        allCerts.push(Certificate({
            issuer          : msg.sender,
            student         : _student,
            enrolmentNumber : _enrolment,
            studentName     : _name,
            degree          : _degree,
            fieldOfStudy    : _field,
            university      : _university,
            year            : _year,
            certHash        : _certHash,
            certId          : _certId,
            timestamp       : block.timestamp,
            isValid         : true
        }));

        uint256 slot = allCerts.length;      // slot+1 (0 = absent)
        hashToIndex[_certHash]   = slot;
        enrolToIndex[_enrolment] = slot;
        studentIndexes[_student].push(slot - 1);
        totalCertificates++;

        emit CertificateIssued(_certHash, _enrolment, _name);
    }

    // ── Verify by stored hash (PRIMARY — most reliable) ──────
    function verifyCertificate(string memory _certHash)
        external view returns (bool)
    {
        uint256 slot = hashToIndex[_certHash];
        if (slot == 0) return false;
        return allCerts[slot - 1].isValid;
    }

    // ── Verify by enrolment + hash ────────────────────────────
    function verifyCertificateHash(string memory _enrolment, string memory _hash)
        external view returns (bool authentic, bool exists)
    {
        uint256 slot = enrolToIndex[_enrolment];
        if (slot == 0) return (false, false);
        Certificate storage cert = allCerts[slot - 1];
        
        // FIXED: Renamed reserved keyword 'match' to 'isMatch'
        bool isMatch = keccak256(bytes(cert.certHash)) == keccak256(bytes(_hash));
        return (isMatch && cert.isValid, true);
    }

    // ── Get full cert by enrolment ────────────────────────────
    function getCertificateByEnrolment(string memory _enrolment)
        external view returns (Certificate memory)
    {
        uint256 slot = enrolToIndex[_enrolment];
        require(slot != 0, "Not found");
        return allCerts[slot - 1];
    }
    
    // ── Get certs by Student Wallet ───────────────────────────
    function getCertificatesByStudent(address _student)
        external view returns (Certificate[] memory)
    {
        uint256[] memory indexes = studentIndexes[_student];
        Certificate[] memory result = new Certificate[](indexes.length);
        for (uint256 i = 0; i < indexes.length; i++) {
            result[i] = allCerts[indexes[i]];
        }
        return result;
    }

    // ── Get all certs (public registry) ──────────────────────
    function getAllCertificates()
        external view returns (Certificate[] memory)
    {
        return allCerts;
    }

    function totalCertificatesCount() external view returns (uint256) {
        return totalCertificates;
    }
}