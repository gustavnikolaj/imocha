const expect = require("unexpected");
const findRelationsInSourceCode = require("../lib/find-relations-in-source-code");

describe("findRelationsInSourceCode", () => {
  it("should be a function", () => {
    expect(findRelationsInSourceCode, "to be a function");
  });

  it("should return an empty list of required files", () => {
    expect(
      findRelationsInSourceCode(`
        module.exports = function () {};
      `),
      "to equal",
      []
    );
  });

  it("should return a list of required files", () => {
    expect(
      findRelationsInSourceCode(`
        require('./another-file');
        module.exports = function () {};
      `),
      "to equal",
      ["./another-file"]
    );
  });

  it("should return a list of imported files", () => {
    expect(
      findRelationsInSourceCode(`
        import foo from './someFile'
        import './another-file';
        export default function () {};
      `),
      "to equal",
      ["./someFile", "./another-file"]
    );
  });

  it("should support object/rest spread syntax", () => {
    expect(
      findRelationsInSourceCode(`
        module.exports = { ...process.env, MY_ENV: false };
      `),
      "to equal",
      []
    );
  });

  it("should support jsx syntax", () => {
    expect(
      findRelationsInSourceCode(`
        import User from './User'
        export const UserDetails = ({ avatar, email, name }) => (
          <div className='user-details'>
            <Avatar className="user-avatar" src={avatar} />
            <span className="user-name">{name}</span>
            <span className="user-email">{email}</span>
          </div>
        );
      `),
      "to equal",
      ["./User"]
    );
  });
});
